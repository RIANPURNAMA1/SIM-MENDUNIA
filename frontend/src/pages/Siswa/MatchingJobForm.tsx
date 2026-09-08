import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ClipboardList, ChevronLeft, ChevronRight, Save, Send, Upload, Plus, Trash2, Loader2,
  LayoutDashboard, Wallet, CalendarCheck, BookOpen, User, X, ShieldCheck, CheckCircle2, Lock, AlertCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../../services/api'

const steps = [
  { label: 'Data Diri' },
  { label: 'Kesehatan' },
  { label: 'Pendidikan' },
  { label: 'Pengalaman' },
  { label: 'Kemampuan' },
  { label: 'Keluarga' },
  { label: 'Jepang' },
  { label: 'Motivasi' },
  { label: 'Dokumen' },
]

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const years = Array.from({ length: 47 }, (_, i) => String(1980 + i))

const sswFields = [
  'Pengolahan Makanan', 'Pertanian', 'Peternakan', 'Gaishoku', 'Kaigo (perawat)', 'Building Cleaning',
  'Restoran', 'Driver', 'Perhotelan', 'Perikanan', 'Perbaikan dan Perawatan Mobil', 'Konstruksi',
]

const inputCls = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400'

const API_WILAYAH = 'https://cdn.jsdelivr.net/gh/izzulabadi/api-wilayah-indonesia-2026@v1.0.4/api'

interface Wilayah {
  id: string
  name: string
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={error ? 'rounded-md ring-2 ring-red-300' : ''}>{children}</div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

function YesNo({ label, required, value, onChange, error }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} required={required} error={error}>
      <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Pilih...</option>
        <option value="Ya">Ya</option>
        <option value="Tidak">Tidak</option>
      </select>
    </Field>
  )
}

function MonthYear({ required, bulan, tahun, onBulan, onTahun, error }: { required?: boolean; bulan: string; tahun: string; onBulan: (v: string) => void; onTahun: (v: string) => void; error?: string }) {
  return (
    <div>
      <div className={`grid grid-cols-2 gap-2 ${error ? '[&_select]:ring-2 [&_select]:ring-red-300 [&_select]:border-red-300' : ''}`}>
        <select className={inputCls} value={bulan} onChange={e => onBulan(e.target.value)}>
          <option value="">Bulan{required ? ' *' : ''}</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={inputCls} value={tahun} onChange={e => onTahun(e.target.value)}>
          <option value="">Tahun{required ? ' *' : ''}</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

function UploadRow({ label, required, note, file, onFileChange, maxKB, error }: { label: string; required?: boolean; note?: string; file: File | null; onFileChange: (f: File | null) => void; maxKB?: number; error?: string }) {
  const limit = maxKB || 500
  return (
    <div className={`rounded-lg border bg-slate-50/60 p-3 ${error ? 'border-red-300 ring-2 ring-red-300' : 'border-slate-200'}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          {note && <p className="text-[11px] text-slate-400">{note}</p>}
        </div>
        <div className="flex items-center gap-2">
          {file ? (
            <span className="max-w-[180px] truncate text-xs text-slate-500">{file.name}</span>
          ) : (
            <span className="text-xs text-slate-400">Belum ada file</span>
          )}
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Upload size={13} />
            Upload
            <input
              type="file"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] || null
                if (f && f.size > limit * 1024) {
                  Swal.fire({ icon: 'warning', title: 'File terlalu besar', text: `Ukuran maks ${limit}KB untuk ${label}.`, confirmButtonColor: '#0E6187' })
                  e.target.value = ''
                  return
                }
                onFileChange(f)
              }}
            />
          </label>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

interface Pengalaman {
  nama_perusahaan: string
  alamat_perusahaan: string
  posisi: string
  bulan_masuk: string
  tahun_masuk: string
  bulan_keluar: string
  tahun_keluar: string
  masih_bekerja: boolean
  deskripsi_pekerjaan: string
  alasan_keluar: string
}

function ExperienceCard({ value, onChange, onRemove, getError, paklaring, onPaklaring }: { value: Pengalaman; onChange: (v: Pengalaman) => void; onRemove: () => void; getError?: (k: string) => string | undefined; paklaring?: File | null; onPaklaring?: (f: File | null) => void }) {
  const set = (k: keyof Pengalaman) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value })
  const setBulan = (k: 'bulan_masuk' | 'tahun_masuk' | 'bulan_keluar' | 'tahun_keluar') => (v: string) => onChange({ ...value, [k]: v })
  const err = (k: string) => (getError ? getError(k) : undefined)
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Pengalaman Kerja</p>
        <button onClick={onRemove} className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600">
          <Trash2 size={13} />
          Hapus
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama Perusahaan" required error={err('nama_perusahaan')}><input className={inputCls} placeholder="Nama perusahaan" value={value.nama_perusahaan} onChange={set('nama_perusahaan')} /></Field>
        <Field label="Posisi / Jabatan" required error={err('posisi')}><input className={inputCls} placeholder="Posisi" value={value.posisi} onChange={set('posisi')} /></Field>
        <Field label="Periode Masuk" required><MonthYear required bulan={value.bulan_masuk} tahun={value.tahun_masuk} onBulan={setBulan('bulan_masuk')} onTahun={setBulan('tahun_masuk')} error={err('bulan_masuk') || err('tahun_masuk')} /></Field>
        <Field label="Periode Keluar" required><MonthYear required bulan={value.bulan_keluar} tahun={value.tahun_keluar} onBulan={setBulan('bulan_keluar')} onTahun={setBulan('tahun_keluar')} error={err('bulan_keluar') || err('tahun_keluar')} /></Field>
        <div className="sm:col-span-2">
          <Field label="Deskripsi Pekerjaan">
            <textarea className={`${inputCls} min-h-[70px]`} placeholder="Tugas dan tanggung jawab..." value={value.deskripsi_pekerjaan} onChange={set('deskripsi_pekerjaan')} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Alasan Keluar">
            <textarea className={`${inputCls} min-h-[70px]`} placeholder="Alasan berhenti / keluar dari perusahaan..." value={value.alasan_keluar} onChange={set('alasan_keluar')} />
          </Field>
        </div>
        {onPaklaring && (
          <div className="sm:col-span-2">
            <UploadRow label="Sertifikasi / Paklaring" note="Opsional — Maks 500KB" maxKB={500} file={paklaring || null} onFileChange={onPaklaring} />
          </div>
        )}
      </div>
    </div>
  )
}

interface Keluarga {
  hubungan: string
  nama: string
  usia: string
  pekerjaan: string
  penghasilan: string
}

function FamilyMemberCard({ title, hubungan, value, onChange, required, getError }: { title: string; hubungan: string; value: Keluarga; onChange: (v: Keluarga) => void; required?: boolean; getError?: (k: string) => string | undefined }) {
  const set = (k: keyof Keluarga) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value })
  const err = (k: string) => (getError ? getError(k) : undefined)
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama" required={required} error={err('nama')}><input className={inputCls} placeholder="Nama" value={value.nama} onChange={set('nama')} /></Field>
        <Field label="Usia" required={required} error={err('usia')}><input className={inputCls} placeholder="Usia" value={value.usia} onChange={set('usia')} /></Field>
        <Field label="Pekerjaan" required={required} error={err('pekerjaan')}><input className={inputCls} placeholder="Pekerjaan" value={value.pekerjaan} onChange={set('pekerjaan')} /></Field>
        <Field label="Penghasilan/Bulan" required={required} error={err('penghasilan')}>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-500">Rp</span>
            <input className={`${inputCls} rounded-l-none`} placeholder="0" value={value.penghasilan} onChange={set('penghasilan')} />
          </div>
        </Field>
      </div>
      <input type="hidden" value={hubungan} onChange={() => {}} />
    </div>
  )
}

function MultiFamily({ title, addLabel, values, onChange }: { title: string; addLabel: string; values: Keluarga[]; onChange: (v: Keluarga[]) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <button
          onClick={() => onChange([...values, { hubungan: title, nama: '', usia: '', pekerjaan: '', penghasilan: '' }])}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Plus size={13} />
          {addLabel}
        </button>
      </div>
      {values.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
          Belum ada. Klik tombol untuk menambah.
        </p>
      ) : (
        <div className="space-y-3">
          {values.map((v, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">{title} #{i + 1}</p>
                <button
                  onClick={() => onChange(values.filter((_, x) => x !== i))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                >
                  <Trash2 size={12} />
                  Hapus
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Nama" value={v.nama} onChange={e => { const n = [...values]; n[i] = { ...v, nama: e.target.value }; onChange(n) }} />
                <input className={inputCls} placeholder="Usia" value={v.usia} onChange={e => { const n = [...values]; n[i] = { ...v, usia: e.target.value }; onChange(n) }} />
                <input className={inputCls} placeholder="Pekerjaan" value={v.pekerjaan} onChange={e => { const n = [...values]; n[i] = { ...v, pekerjaan: e.target.value }; onChange(n) }} />
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-500">Rp</span>
                  <input className={`${inputCls} rounded-l-none`} placeholder="0" value={v.penghasilan} onChange={e => { const n = [...values]; n[i] = { ...v, penghasilan: e.target.value }; onChange(n) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Pendidikan {
  nama_sekolah: string
  jurusan: string
  bulan_masuk: string
  tahun_masuk: string
  bulan_lulus: string
  tahun_lulus: string
}

function EducationBlock({ title, value, onChange, required, getError, ijazah, onIjazah }: { title: string; value: Pendidikan; onChange: (v: Pendidikan) => void; required?: boolean; getError?: (k: string) => string | undefined; ijazah?: File | null; onIjazah?: (f: File | null) => void }) {
  const set = (k: keyof Pendidikan) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value })
  const setBulan = (k: 'bulan_masuk' | 'tahun_masuk' | 'bulan_lulus' | 'tahun_lulus') => (v: string) => onChange({ ...value, [k]: v })
  const err = (k: string) => (getError ? getError(k) : undefined)
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nama Sekolah / Universitas" required={required} error={err('nama_sekolah')}>
            <input className={inputCls} placeholder={title} value={value.nama_sekolah} onChange={set('nama_sekolah')} />
          </Field>
        </div>
        {title === 'SMA/SMK' || title === 'Perguruan Tinggi' ? (
          <div className="sm:col-span-2">
            <Field label="Jurusan">
              <input className={inputCls} placeholder="Jurusan / Prodi" value={value.jurusan} onChange={set('jurusan')} />
            </Field>
          </div>
        ) : null}
        <Field label="Bulan & Tahun Masuk" required={required}>
          <MonthYear required={required} bulan={value.bulan_masuk} tahun={value.tahun_masuk} onBulan={setBulan('bulan_masuk')} onTahun={setBulan('tahun_masuk')} error={err('bulan_masuk') || err('tahun_masuk')} />
        </Field>
        <Field label="Bulan & Tahun Lulus" required={required}>
          <MonthYear required={required} bulan={value.bulan_lulus} tahun={value.tahun_lulus} onBulan={setBulan('bulan_lulus')} onTahun={setBulan('tahun_lulus')} error={err('bulan_lulus') || err('tahun_lulus')} />
        </Field>
      </div>
      {onIjazah && (
        <div className="mt-3">
          <UploadRow label={`Ijazah ${title}`} required={required} note="Maks 500KB" maxKB={500} file={ijazah || null} onFileChange={onIjazah} error={err('ijazah')} />
        </div>
      )}
    </div>
  )
}

const emptyPendidikan = (): Pendidikan => ({ nama_sekolah: '', jurusan: '', bulan_masuk: '', tahun_masuk: '', bulan_lulus: '', tahun_lulus: '' })
const emptyPengalaman = (): Pengalaman => ({ nama_perusahaan: '', alamat_perusahaan: '', posisi: '', bulan_masuk: '', tahun_masuk: '', bulan_keluar: '', tahun_keluar: '', masih_bekerja: false, deskripsi_pekerjaan: '', alasan_keluar: '' })
const emptyKeluarga = (hubungan: string): Keluarga => ({ hubungan, nama: '', usia: '', pekerjaan: '', penghasilan: '' })

const boolToStr = (v: any): string =>
  v === 1 || v === true ? 'Ya' : v === 0 || v === false ? 'Tidak' : ''


const dokumenList: { jenis: string; label: string; required: boolean; maxKB: number }[] = [
  { jenis: 'sertifikat_jft', label: 'Sertifikat JFT', required: false, maxKB: 500 },
  { jenis: 'pas_foto', label: 'Pas Foto', required: true, maxKB: 500 },
  { jenis: 'foto_full_body', label: 'Foto Full Body', required: true, maxKB: 3000 },
  { jenis: 'kk', label: 'Kartu Keluarga (KK)', required: true, maxKB: 500 },
  { jenis: 'ktp', label: 'KTP', required: true, maxKB: 500 },
  { jenis: 'ijazah', label: 'Ijazah', required: true, maxKB: 500 },
  { jenis: 'akte', label: 'Akte Kelahiran', required: true, maxKB: 500 },
  { jenis: 'lainnya', label: 'Dokumen Lainnya', required: false, maxKB: 500 },
]

export default function MatchingJobForm({ adminKandidatId, onClose }: { adminKandidatId?: number; onClose?: () => void } = {}) {
  const [activeStep, setActiveStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, setStatusFormulir] = useState('draft')
  const [kandidatId, setKandidatId] = useState<number | null>(null)
  const studentIdentity = useRef<{ email: string; nama: string }>({ email: '', nama: '' })
  const hydratedRef = useRef(false)
  const [sending, setSending] = useState(false)
  const [pengalaman, setPengalaman] = useState<Pengalaman[]>([])
  const [pengalamanPaklaring, setPengalamanPaklaring] = useState<Record<number, File | null>>({})
  const [sswSelected, setSswSelected] = useState<Set<string>>(new Set())
  const [sswCert, setSswCert] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [provinsiList, setProvinsiList] = useState<Wilayah[]>([])
  const [kabupatenList, setKabupatenList] = useState<Wilayah[]>([])
  const [kecamatanList, setKecamatanList] = useState<Wilayah[]>([])
  const [desaList, setDesaList] = useState<Wilayah[]>([])
  const [wilayahLoading, setWilayahLoading] = useState({ provinsi: false, kabupaten: false, kecamatan: false, desa: false })
  const [dokumen, setDokumen] = useState<Record<string, File | null>>({})
  const [cabangList, setCabangList] = useState<{ id: number; nama_cabang: string }[]>([])
  const location = useLocation()

  const [form, setForm] = useState({
    cabang: '',
    nik: '',
    namaKatakana: '',
    namaRomaji: '',
    tempatLahir: '',
    tanggalLahir: '',
    umur: '',
    jenisKelamin: '',
    statusPernikahan: '',
    agama: '',
    tinggiBadan: '',
    beratBadan: '',
    golonganDarah: '',
    tanganDominan: '',
    ukuranBaju: '',
    lingkarPinggang: '',
    panjangTelapakKaki: '',
    sim: '',
    noHp: '',
    email: '',
    namaOrtu: '',
    noHpOrtu: '',
    alamatLengkap: '',
    alamatProvinsi: '',
    alamatKabupaten: '',
    alamatKecamatan: '',
    alamatDesa: '',
    pendidikanTerakhir: '',
    tahunLulus: '',
    sudahVaksin: '',
    kondisiKesehatan: '',
    catatanKesehatan: '',
    penglihatanKanan: '',
    penglihatanKiri: '',
    berkacamata: '',
    lensaKontak: '',
    butaWarna: '',
    jenisButaWarna: '',
    bertato: '',
    merokok: '',
    minumAlkohol: '',
    riwayatPenyakit: '',
    levelJlpt: '',
    levelJft: '',
    lamaBelajarJepang: '',
    levelBahasaJepang: '',
    idPrometric: '',
    passwordPrometric: '',
    penghasilanKeluarga: '',
    pernahKeJepang: '',
    keluargaDiJepang: '',
    kenalanDiJepang: '',
    tujuanKeJepang: '',
    alasanKeJepang: '',
    citaCitaSetelahJepang: '',
    rencanaPengirimanUang: '',
    kelebihanDiri: '',
    kekuranganDiri: '',
    hobi: '',
    keahlian: '',
    bersediaShift: '',
    bersediaLembur: '',
    bersediaHariLibur: '',
    lamaTinggalJepang: '',
    lamaKerjaPerusahaan: '',
    rencanaPulang: '',
    sumberBiaya: '',
    biayaDisiapkan: '',
  })

  const [pendidikan, setPendidikan] = useState<Record<string, Pendidikan>>({
    SD: emptyPendidikan(),
    SMP: emptyPendidikan(),
    'SMA/SMK': emptyPendidikan(),
    'Perguruan Tinggi': emptyPendidikan(),
  })
  const [pendidikanIjazah, setPendidikanIjazah] = useState<Record<string, File | null>>({})
  const [ayah, setAyah] = useState<Keluarga>(emptyKeluarga('Ayah'))
  const [ibu, setIbu] = useState<Keluarga>(emptyKeluarga('Ibu'))
  const [suami, setSuami] = useState<Keluarga[]>([])
  const [istri, setIstri] = useState<Keluarga[]>([])
  const [kakak, setKakak] = useState<Keluarga[]>([])
  const [adik, setAdik] = useState<Keluarga[]>([])

  const hitungUmur = (tanggalLahir: string) => {
    const birth = new Date(tanggalLahir)
    if (!tanggalLahir || isNaN(birth.getTime())) return ''
    return String(Math.max(0, Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000))))
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'tanggalLahir') next.umur = hitungUmur(val)
      return next
    })
    setErrors(prev => { if (!prev[key]) return prev; const next = { ...prev }; delete next[key]; return next })
  }

  const fetchKabupaten = useCallback((provId: string) => {
    setKabupatenList([])
    setKecamatanList([])
    setDesaList([])
    if (!provId) return
    setWilayahLoading(p => ({ ...p, kabupaten: true }))
    fetch(`${API_WILAYAH}/regencies/${provId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setKabupatenList(data))
      .catch(() => {})
      .finally(() => setWilayahLoading(p => ({ ...p, kabupaten: false })))
  }, [])

  const fetchKecamatan = useCallback((kabId: string) => {
    setKecamatanList([])
    setDesaList([])
    if (!kabId) return
    setWilayahLoading(p => ({ ...p, kecamatan: true }))
    fetch(`${API_WILAYAH}/districts/${kabId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setKecamatanList(data))
      .catch(() => {})
      .finally(() => setWilayahLoading(p => ({ ...p, kecamatan: false })))
  }, [])

  const fetchDesa = useCallback((kecId: string) => {
    setDesaList([])
    if (!kecId) return
    setWilayahLoading(p => ({ ...p, desa: true }))
    fetch(`${API_WILAYAH}/villages/${kecId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setDesaList(data))
      .catch(() => {})
      .finally(() => setWilayahLoading(p => ({ ...p, desa: false })))
  }, [])

  useEffect(() => {
    setWilayahLoading(p => ({ ...p, provinsi: true }))
    fetch(`${API_WILAYAH}/provinces.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setProvinsiList(data))
      .catch(() => {})
      .finally(() => setWilayahLoading(p => ({ ...p, provinsi: false })))
  }, [])

  useEffect(() => {
    if (!provinsiList.length || !form.alamatProvinsi) return
    const found = provinsiList.find(p => p.name.toLowerCase() === form.alamatProvinsi.toLowerCase())
    if (found) fetchKabupaten(found.id)
  }, [provinsiList, form.alamatProvinsi, fetchKabupaten])

  useEffect(() => {
    if (!kabupatenList.length || !form.alamatKabupaten) return
    const found = kabupatenList.find(k => k.name.toLowerCase() === form.alamatKabupaten.toLowerCase())
    if (found) fetchKecamatan(found.id)
  }, [kabupatenList, form.alamatKabupaten, fetchKecamatan])

  useEffect(() => {
    if (!kecamatanList.length || !form.alamatKecamatan) return
    const found = kecamatanList.find(k => k.name.toLowerCase() === form.alamatKecamatan.toLowerCase())
    if (found) fetchDesa(found.id)
  }, [kecamatanList, form.alamatKecamatan, fetchDesa])

  const findIdByName = (list: Wilayah[], name: string) => {
    if (!list.length || !name) return ''
    return list.find(w => w.name.toLowerCase() === name.toLowerCase())?.id || ''
  }

  const clearErrors = (keys: string[]) => {
    setErrors(prev => {
      if (!keys.some(k => prev[k])) return prev
      const next = { ...prev }
      keys.forEach(k => { delete next[k] })
      return next
    })
  }

  const clearStepErrors = (step: number) => {
    const keys = stepKeys[step] || []
    setErrors(prev => {
      const next = { ...prev }
      let changed = false
      keys.forEach(k => {
        if (next[k]) { delete next[k]; changed = true }
        else {
          Object.keys(next).forEach(full => {
            if (full.startsWith(k + '.')) { delete next[full]; changed = true }
          })
        }
      })
      return changed ? next : prev
    })
  }

  const req = (errs: Record<string, string>, key: string, v: any, label: string, extra?: string) => {
    if (v === '' || v === null || v === undefined || v === 'Pilih...') {
      errs[key] = extra || `${label} wajib diisi.`
    }
  }

  const validateStep = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (step === 0) {
      req(errs, 'cabang', form.cabang, 'Cabang Mendunia')
      req(errs, 'nik', form.nik, 'NIK')
      if (form.nik && !/^\d{16}$/.test(form.nik)) errs.nik = 'NIK harus 16 digit angka.'
      req(errs, 'namaKatakana', form.namaKatakana, 'Nama (Katakana)')
      req(errs, 'namaRomaji', form.namaRomaji, 'Nama Lengkap')
      req(errs, 'tempatLahir', form.tempatLahir, 'Tempat Lahir')
      req(errs, 'tanggalLahir', form.tanggalLahir, 'Tanggal Lahir')
      req(errs, 'umur', form.umur, 'Umur')
      if (form.umur && (Number(form.umur) < 15 || Number(form.umur) > 60)) errs.umur = 'Umur harus antara 15–60 tahun.'
      req(errs, 'jenisKelamin', form.jenisKelamin, 'Jenis Kelamin')
      req(errs, 'statusPernikahan', form.statusPernikahan, 'Status Pernikahan')
      req(errs, 'agama', form.agama, 'Agama')
      req(errs, 'tinggiBadan', form.tinggiBadan, 'Tinggi Badan')
      if (form.tinggiBadan && Number(form.tinggiBadan) <= 0) errs.tinggiBadan = 'Tinggi badan tidak valid.'
      req(errs, 'beratBadan', form.beratBadan, 'Berat Badan')
      if (form.beratBadan && Number(form.beratBadan) <= 0) errs.beratBadan = 'Berat badan tidak valid.'
      req(errs, 'golonganDarah', form.golonganDarah, 'Golongan Darah')
      req(errs, 'tanganDominan', form.tanganDominan, 'Tangan Dominan')
      req(errs, 'ukuranBaju', form.ukuranBaju, 'Ukuran Baju')
      req(errs, 'noHp', form.noHp, 'Nomor HP')
      if (form.noHp && !/^[0-9+()\s-]{8,20}$/.test(form.noHp)) errs.noHp = 'Format nomor HP tidak valid.'
      if (!form.email) errs.email = 'Email Kontak wajib diisi.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid.'
      req(errs, 'namaOrtu', form.namaOrtu, 'Nama Orang Tua / Wali')
      req(errs, 'noHpOrtu', form.noHpOrtu, 'No. HP Orang Tua')
      req(errs, 'alamatLengkap', form.alamatLengkap, 'Alamat Lengkap')
    } else if (step === 1) {
      req(errs, 'sudahVaksin', form.sudahVaksin, 'Sudah Vaksin')
      req(errs, 'kondisiKesehatan', form.kondisiKesehatan, 'Kondisi Kesehatan')
      if (form.kondisiKesehatan === 'Sehat dengan catatan' && !form.catatanKesehatan) errs.catatanKesehatan = 'Catatan kondisi kesehatan wajib diisi saat memilih "Sehat dengan catatan".'
      req(errs, 'berkacamata', form.berkacamata, 'Berkacamata')
      req(errs, 'lensaKontak', form.lensaKontak, 'Lensa Kontak')
      req(errs, 'butaWarna', form.butaWarna, 'Buta Warna')
      if (form.butaWarna === 'Ya') req(errs, 'jenisButaWarna', form.jenisButaWarna, 'Jenis Buta Warna')
      req(errs, 'bertato', form.bertato, 'Bertato')
      req(errs, 'merokok', form.merokok, 'Merokok')
      req(errs, 'minumAlkohol', form.minumAlkohol, 'Minum Alkohol')
      req(errs, 'riwayatPenyakit', form.riwayatPenyakit, 'Riwayat Penyakit / Cedera')
    } else if (step === 2) {
      req(errs, 'pendidikanTerakhir', form.pendidikanTerakhir, 'Pendidikan Terakhir')
      ;(['SD', 'SMP'] as const).forEach(j => {
        const b = pendidikan[j]
        if (!b.nama_sekolah) errs[`${j}.nama_sekolah`] = `Nama sekolah ${j} wajib diisi.`
        if (!b.bulan_masuk) errs[`${j}.bulan_masuk`] = `Bulan masuk ${j} wajib diisi.`
        if (!b.tahun_masuk) errs[`${j}.tahun_masuk`] = `Tahun masuk ${j} wajib diisi.`
        if (!b.bulan_lulus) errs[`${j}.bulan_lulus`] = `Bulan lulus ${j} wajib diisi.`
        if (!b.tahun_lulus) errs[`${j}.tahun_lulus`] = `Tahun lulus ${j} wajib diisi.`
        if (!pendidikanIjazah[j]) errs[`${j}.ijazah`] = `Ijazah ${j} wajib diupload.`
      })
    } else if (step === 3) {
      pengalaman.forEach((p, i) => {
        if (!p.nama_perusahaan) errs[`pengalaman.${i}.nama_perusahaan`] = `Nama perusahaan ke-${i + 1} wajib diisi.`
        if (!p.posisi) errs[`pengalaman.${i}.posisi`] = `Posisi ke-${i + 1} wajib diisi.`
        if (!p.bulan_masuk) errs[`pengalaman.${i}.bulan_masuk`] = `Bulan masuk ke-${i + 1} wajib diisi.`
        if (!p.tahun_masuk) errs[`pengalaman.${i}.tahun_masuk`] = `Tahun masuk ke-${i + 1} wajib diisi.`
        if (!p.masih_bekerja && !p.bulan_keluar) errs[`pengalaman.${i}.bulan_keluar`] = `Bulan keluar ke-${i + 1} wajib diisi.`
        if (!p.masih_bekerja && !p.tahun_keluar) errs[`pengalaman.${i}.tahun_keluar`] = `Tahun keluar ke-${i + 1} wajib diisi.`
      })
    } else if (step === 4) {
      req(errs, 'levelJlpt', form.levelJlpt, 'Level JLPT')
      req(errs, 'lamaBelajarJepang', form.lamaBelajarJepang, 'Lama Belajar Bahasa Jepang')
      req(errs, 'levelBahasaJepang', form.levelBahasaJepang, 'Level Bahasa Jepang')
    } else if (step === 5) {
      req(errs, 'penghasilanKeluarga', form.penghasilanKeluarga, 'Penghasilan Keluarga')
      ;([['Ayah', ayah], ['Ibu', ibu]] as const).forEach(([label, m]) => {
        if (!m.nama) errs[`${label}.nama`] = `Nama ${label} wajib diisi.`
        if (!m.usia) errs[`${label}.usia`] = `Usia ${label} wajib diisi.`
        if (!m.pekerjaan) errs[`${label}.pekerjaan`] = `Pekerjaan ${label} wajib diisi.`
        if (!m.penghasilan) errs[`${label}.penghasilan`] = `Penghasilan ${label} wajib diisi.`
      })
    } else if (step === 6) {
      req(errs, 'pernahKeJepang', form.pernahKeJepang, 'Pernah ke Jepang')
      req(errs, 'keluargaDiJepang', form.keluargaDiJepang, 'Keluarga di Jepang')
      req(errs, 'kenalanDiJepang', form.kenalanDiJepang, 'Kenalan di Jepang')
    } else if (step === 7) {
      req(errs, 'tujuanKeJepang', form.tujuanKeJepang, 'Tujuan ke Jepang')
      req(errs, 'alasanKeJepang', form.alasanKeJepang, 'Alasan ke Jepang')
      req(errs, 'citaCitaSetelahJepang', form.citaCitaSetelahJepang, 'Cita-cita Setelah Jepang')
      req(errs, 'rencanaPengirimanUang', form.rencanaPengirimanUang, 'Rencana Pengiriman Uang')
      req(errs, 'kelebihanDiri', form.kelebihanDiri, 'Kelebihan Diri')
      req(errs, 'kekuranganDiri', form.kekuranganDiri, 'Kekurangan Diri')
      req(errs, 'hobi', form.hobi, 'Hobi')
      req(errs, 'keahlian', form.keahlian, 'Keahlian')
      req(errs, 'bersediaShift', form.bersediaShift, 'Bersedia Shift')
      req(errs, 'bersediaLembur', form.bersediaLembur, 'Bersedia Lembur')
      req(errs, 'bersediaHariLibur', form.bersediaHariLibur, 'Bersedia Kerja Hari Libur')
      req(errs, 'lamaTinggalJepang', form.lamaTinggalJepang, 'Lama Tinggal di Jepang')
      req(errs, 'lamaKerjaPerusahaan', form.lamaKerjaPerusahaan, 'Lama Kerja di Perusahaan')
      req(errs, 'rencanaPulang', form.rencanaPulang, 'Rencana Pulang')
      req(errs, 'sumberBiaya', form.sumberBiaya, 'Sumber Biaya')
      req(errs, 'biayaDisiapkan', form.biayaDisiapkan, 'Biaya Disiapkan')
    } else if (step === 8) {
      dokumenList.forEach(d => {
        if (d.required && !dokumen[d.jenis]) errs[`dokumen.${d.jenis}`] = `${d.label} wajib diupload.`
      })
    }
    return errs
  }

  const stepKeys: string[][] = [
    ['cabang', 'nik', 'namaKatakana', 'namaRomaji', 'tempatLahir', 'tanggalLahir', 'umur', 'jenisKelamin', 'statusPernikahan', 'agama', 'tinggiBadan', 'beratBadan', 'golonganDarah', 'tanganDominan', 'ukuranBaju', 'noHp', 'email', 'namaOrtu', 'noHpOrtu', 'alamatLengkap'],
    ['sudahVaksin', 'kondisiKesehatan', 'catatanKesehatan', 'berkacamata', 'lensaKontak', 'butaWarna', 'jenisButaWarna', 'bertato', 'merokok', 'minumAlkohol', 'riwayatPenyakit'],
    ['pendidikanTerakhir', 'SD.nama_sekolah', 'SD.bulan_masuk', 'SD.tahun_masuk', 'SD.bulan_lulus', 'SD.tahun_lulus', 'SD.ijazah', 'SMP.nama_sekolah', 'SMP.bulan_masuk', 'SMP.tahun_masuk', 'SMP.bulan_lulus', 'SMP.tahun_lulus', 'SMP.ijazah'],
    ['pengalaman'],
    ['levelJlpt', 'lamaBelajarJepang', 'levelBahasaJepang'],
    ['penghasilanKeluarga', 'Ayah.nama', 'Ayah.usia', 'Ayah.pekerjaan', 'Ayah.penghasilan', 'Ibu.nama', 'Ibu.usia', 'Ibu.pekerjaan', 'Ibu.penghasilan'],
    ['pernahKeJepang', 'keluargaDiJepang', 'kenalanDiJepang'],
    ['tujuanKeJepang', 'alasanKeJepang', 'citaCitaSetelahJepang', 'rencanaPengirimanUang', 'kelebihanDiri', 'kekuranganDiri', 'hobi', 'keahlian', 'bersediaShift', 'bersediaLembur', 'bersediaHariLibur', 'lamaTinggalJepang', 'lamaKerjaPerusahaan', 'rencanaPulang', 'sumberBiaya', 'biayaDisiapkan'],
    dokumenList.map(d => `dokumen.${d.jenis}`),
  ]

  const handleNext = (target: number) => {
    const errs = validateStep(activeStep)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const first = errs[Object.keys(errs)[0]]
      Swal.fire({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: `${Object.keys(errs).length} isian wajib belum terisi. Lengkapi terlebih dahulu: ${first}`,
        confirmButtonColor: '#0E6187',
      })
      document.getElementById('dataForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setErrors({})
    setActiveStep(Math.min(steps.length - 1, target))
  }

  const handleKirim = () => {
    const errs: Record<string, string> = {}
    for (let s = 0; s < steps.length; s++) Object.assign(errs, validateStep(s))
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      Swal.fire({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: `${Object.keys(errs).length} isian wajib belum terisi. Lengkapi seluruh langkah terlebih dahulu.`,
        confirmButtonColor: '#0E6187',
      })
      document.getElementById('dataForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    kirim(true)
  }

  const goToStep = (i: number) => {
    if (i > activeStep) {
      const errs = validateStep(activeStep)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        Swal.fire({
          icon: 'warning',
          title: 'Data belum lengkap',
          text: 'Lengkapi isian wajib terlebih dahulu sebelum beralih ke langkah berikutnya.',
          confirmButtonColor: '#0E6187',
        })
        return
      }
    }
    setErrors({})
    setActiveStep(i)
  }

  useEffect(() => {
    const fillFromIdentity = (u: any, s: any, p: any) => {
      const batch: any = s.batch_relasi || p.batch_relasi || null

      const mapGender = (v: string) => (v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : v || '')
      const mapStatus = (v: string) =>
        v === 'Belum Nikah' ? 'Belum Menikah' : v === 'Nikah' ? 'Menikah' : v || ''
      const mapBaju = (v: string) => (v === 'XS' ? 'S' : v || '')
      const mapPendidikan = (v: string) =>
        v === 'SD/Sederajat' || v === 'SD' ? 'SD / Sederajat' : v === 'SMP/Sederajat' || v === 'SMP' ? 'SMP / Sederajat' : v === 'SMA/Sederajat' || v === 'SMA/SMK' ? 'SMA / SMK / MA / Sederajat' : v === 'D1-D3' || v === 'D3' ? 'Diploma I / II / III / IV (D1–D4)' : v === 'S1' ? 'Sarjana (S1)' : v || ''

      const tanggalLahir = s.tanggal_lahir || u.tanggal_lahir || ''
      const umur = tanggalLahir
        ? String(Math.max(0, Math.floor((Date.now() - new Date(tanggalLahir).getTime()) / (365.25 * 24 * 3600 * 1000))))
        : ''

      setForm(f => ({
        ...f,
        cabang: batch?.cabang?.nama_cabang || '',
        nik: s.nik || u.nik || p.nik || '',
        namaRomaji: s.nama || u.name || '',
        tempatLahir: s.tempat_lahir || u.tempat_lahir || '',
        tanggalLahir: tanggalLahir,
        umur,
        jenisKelamin: mapGender(s.jenis_kelamin || u.jenis_kelamin || ''),
        statusPernikahan: mapStatus(s.status_pernikahan || ''),
        agama: s.agama || u.agama || '',
        tinggiBadan: s.tinggi_badan || '',
        beratBadan: s.berat_badan || '',
        golonganDarah: s.goldar || '',
        ukuranBaju: mapBaju(s.ukuran_baju || ''),
        noHp: s.no_hp || u.no_hp || p.telepon || '',
        email: u.email || '',
        namaOrtu: s.nama_ortu || '',
        noHpOrtu: s.no_hp_ortu || '',
        alamatLengkap: s.alamat || u.alamat || p.alamat || '',
        alamatProvinsi: s.provinsi || p.provinsi || '',
        alamatKabupaten: s.kabupaten || p.kabupaten || '',
        alamatKecamatan: s.kecamatan || p.kecamatan || '',
        alamatDesa: s.desa || p.desa || '',
        pendidikanTerakhir: mapPendidikan(s.pendidikan_terakhir || u.pendidikan_terakhir || ''),
        tahunLulus: s.tahun_lulus || '',
      }))

      studentIdentity.current = {
        email: (u.email || '').trim(),
        nama: (s.nama || u.name || '').trim(),
      }
    }

    if (adminKandidatId) {
      api.get(`/kandidat/${adminKandidatId}/matching-job`)
        .then(res => {
          const d: any = res.data?.data || res.data || {}
          const u: any = d.user || {}
          const s: any = d.siswa || {}
          const p: any = d.pendaftar || {}
          const mj: any = d.matching_job || {}
          fillFromIdentity(u, s, p)
          if (mj?.penempatan_kandidat_id) {
            setKandidatId(mj.penempatan_kandidat_id)
            if (mj.status_formulir) setStatusFormulir(mj.status_formulir)
            if (!hydratedRef.current && mj.data && Object.keys(mj.data).length > 0) {
              hydratedRef.current = true
              hydrateFromV2(mj.data)
            }
          } else {
            syncStatus()
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      api.get('/siswa-dashboard')
        .then(res => {
          const u: any = res.data?.user || {}
          const s: any = res.data?.siswa || {}
          const p: any = res.data?.pendaftar || {}
          const mj: any = res.data?.matching_job || null
          fillFromIdentity(u, s, p)
          if (mj?.penempatan_kandidat_id) setKandidatId(mj.penempatan_kandidat_id)
          if (mj?.status_formulir) setStatusFormulir(mj.status_formulir)
          if (!hydratedRef.current && mj?.data && Object.keys(mj.data).length > 0) {
            hydratedRef.current = true
            hydrateFromV2(mj.data)
          } else {
            syncStatus()
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    api.get('/penempatan/cabang')
      .then(res => {
        const list = Array.isArray(res.data?.data) ? res.data.data : []
        setCabangList(list.map((c: any) => ({ id: c.id, nama_cabang: c.nama_cabang })))
      })
      .catch(() => {})
  }, [adminKandidatId])

  const syncStatus = () => {
    const { email, nama } = studentIdentity.current
    const query = nama || email
    if (!query) return
    api.get('/penempatan/kandidat', { params: { search: query, limit: 20 } })
      .then(res2 => {
        const list: any[] = Array.isArray(res2.data?.data) ? res2.data.data : []
        const rec = list.find((k: any) =>
          email && (k.email_kontak || '').toLowerCase() === email.toLowerCase()
        ) || list.find((k: any) =>
          nama && (k.nama_romaji || '').toLowerCase() === nama.toLowerCase()
        )
        if (rec?.id) {
          setKandidatId(rec.id)
          if (rec.status_formulir) setStatusFormulir(rec.status_formulir)
          if (!hydratedRef.current) {
            hydratedRef.current = true
            loadKandidatData(rec.id)
          }
        }
      })
      .catch(() => {})
  }

  const hydrateFromV2 = (src: any) => {
    const v: any = src
    if (!v) return

      setSswSelected(new Set(
        Array.isArray(v.sertifikat_ssw)
          ? v.sertifikat_ssw
          : typeof v.sertifikat_ssw === 'string' && v.sertifikat_ssw
            ? v.sertifikat_ssw.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []
      ))

      setForm(f => ({
        ...f,
        cabang: v.nama_cabang || f.cabang,
        nik: v.nik || f.nik,
        namaKatakana: v.nama_katakana || '',
        namaRomaji: v.nama_romaji || f.namaRomaji,
        tempatLahir: v.tempat_lahir || '',
        tanggalLahir: v.tanggal_lahir || '',
        umur: v.umur ?? '',
        jenisKelamin: v.jenis_kelamin || '',
        statusPernikahan: v.status_pernikahan || '',
        agama: v.agama || '',
        tinggiBadan: v.tinggi_badan ?? '',
        beratBadan: v.berat_badan ?? '',
        golonganDarah: v.golongan_darah || '',
        tanganDominan: v.tangan_dominan || '',
        ukuranBaju: v.ukuran_baju || '',
        lingkarPinggang: v.lingkar_pinggang ?? '',
        panjangTelapakKaki: v.panjang_telapak_kaki ?? '',
        sim: v.sim_dimiliki || '',
        noHp: v.nomor_hp || '',
        email: v.email_kontak || v.email || f.email,
        namaOrtu: v.kontak_ortu_nama || '',
        noHpOrtu: v.kontak_ortu_hp || '',
        alamatLengkap: v.alamat_lengkap || '',
        alamatProvinsi: v.alamat_provinsi || '',
        alamatKabupaten: v.alamat_kabupaten || '',
        alamatKecamatan: v.alamat_kecamatan || '',
        alamatDesa: v.alamat_desa || '',
        pendidikanTerakhir: v.pendidikan_terakhir || '',
        tahunLulus: v.tahun_lulus ?? '',
        sudahVaksin: boolToStr(v.sudah_vaksin),
        kondisiKesehatan: v.kondisi_kesehatan || '',
        catatanKesehatan: v.catatan_kesehatan || '',
        penglihatanKanan: v.penglihatan_kanan || '',
        penglihatanKiri: v.penglihatan_kiri || '',
        berkacamata: boolToStr(v.berkacamata),
        lensaKontak: boolToStr(v.lensa_kontak),
        butaWarna: boolToStr(v.buta_warna),
        jenisButaWarna: v.jenis_buta_warna || '',
        bertato: boolToStr(v.bertato),
        merokok: boolToStr(v.merokok),
        minumAlkohol: boolToStr(v.minum_alkohol),
        riwayatPenyakit: v.riwayat_penyakit || '',
        levelJlpt: v.level_jlpt || '',
        levelJft: v.level_jft || '',
        lamaBelajarJepang: v.lama_belajar_jepang || '',
        levelBahasaJepang: v.level_bahasa_jepang || '',
        idPrometric: v.id_prometric || '',
        passwordPrometric: v.password_prometric || '',
        penghasilanKeluarga: v.penghasilan_keluarga ?? '',
        pernahKeJepang: boolToStr(v.pernah_ke_jepang),
        keluargaDiJepang: boolToStr(v.keluarga_di_jepang),
        kenalanDiJepang: boolToStr(v.kenalan_di_jepang),
        tujuanKeJepang: v.tujuan_ke_jepang || '',
        alasanKeJepang: v.alasan_ke_jepang || '',
        citaCitaSetelahJepang: v.cita_cita_setelah_jepang || '',
        rencanaPengirimanUang: v.rencana_pengiriman_uang ?? '',
        kelebihanDiri: v.kelebihan_diri || '',
        kekuranganDiri: v.kekurangan_diri || '',
        hobi: v.hobi || '',
        keahlian: v.keahlian || '',
        bersediaShift: boolToStr(v.bersedia_shift),
        bersediaLembur: boolToStr(v.bersedia_lembur),
        bersediaHariLibur: boolToStr(v.bersedia_hari_libur),
        lamaTinggalJepang: v.lama_tinggal_jepang || '',
        lamaKerjaPerusahaan: v.lama_kerja_perusahaan || '',
        rencanaPulang: v.rencana_pulang || '',
        sumberBiaya: v.sumber_biaya || '',
        biayaDisiapkan: v.biaya_disiapkan || '',
      }))

      if (Array.isArray(v.pendidikan)) {
        const pd: Record<string, Pendidikan> = {
          SD: emptyPendidikan(),
          SMP: emptyPendidikan(),
          'SMA/SMK': emptyPendidikan(),
          'Perguruan Tinggi': emptyPendidikan(),
        }
        v.pendidikan.forEach((p: any) => {
          if (pd[p.jenjang]) {
            pd[p.jenjang] = {
              nama_sekolah: p.nama_sekolah || '',
              jurusan: p.jurusan || '',
              bulan_masuk: p.bulan_masuk || '',
              tahun_masuk: p.tahun_masuk ?? '',
              bulan_lulus: p.bulan_lulus || '',
              tahun_lulus: p.tahun_lulus ?? '',
            }
          }
        })
        setPendidikan(pd)
      }

      if (Array.isArray(v.pengalaman)) {
        setPengalaman(v.pengalaman.map((p: any) => ({
          nama_perusahaan: p.nama_perusahaan || '',
          alamat_perusahaan: p.alamat_perusahaan || '',
          posisi: p.posisi || '',
          bulan_masuk: p.bulan_masuk || '',
          tahun_masuk: p.tahun_masuk ?? '',
          bulan_keluar: p.bulan_keluar || '',
          tahun_keluar: p.tahun_keluar ?? '',
          masih_bekerja: !!p.masih_bekerja,
          deskripsi_pekerjaan: p.deskripsi_pekerjaan || '',
          alasan_keluar: p.alasan_keluar || '',
        })))
      }

      if (Array.isArray(v.keluarga)) {
        const by = (hub: string) => v.keluarga.filter((k: any) => k.hubungan === hub)
        const toK = (k: any): Keluarga => ({
          hubungan: k.hubungan || '',
          nama: k.nama || '',
          usia: k.usia ?? '',
          pekerjaan: k.pekerjaan || '',
          penghasilan: k.penghasilan || '',
        })
        setAyah(by('Ayah')[0] ? toK(by('Ayah')[0]) : emptyKeluarga('Ayah'))
        setIbu(by('Ibu')[0] ? toK(by('Ibu')[0]) : emptyKeluarga('Ibu'))
        setSuami(by('Suami').map(toK))
        setIstri(by('Istri').map(toK))
        setKakak(by('Kakak').map(toK))
        setAdik(by('Adik').map(toK))
    }
  }

  const loadKandidatData = async (id: number) => {
    try {
      const res = await api.get(`/penempatan/kandidat/${id}`)
      hydrateFromV2(res.data?.data)
    } catch {
      // abaikan jika gagal mengambil detail
    }
  }

  useEffect(() => {
    const interval = setInterval(syncStatus, 10000)
    const onFocus = () => syncStatus()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const toggleSsw = (f: string) => {
    setSswSelected(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const toBool = (v: string) => (v === 'Ya' ? 1 : v === 'Tidak' ? 0 : null)
  const toNum = (v: string) => (v === '' ? null : Number(v))

  const buildPayload = (final = false) => {
    const keluarga: Array<{
      hubungan: string
      nama: string | null
      usia: number | null
      pekerjaan: string | null
      penghasilan: string | null
    }> = [ayah, ibu, ...suami, ...istri, ...kakak, ...adik].filter(k =>
      k.nama || k.pekerjaan || k.usia
    ).map(k => ({
      hubungan: k.hubungan,
      nama: k.nama || null,
      usia: k.usia ? Number(k.usia) : null,
      pekerjaan: k.pekerjaan || null,
      penghasilan: k.penghasilan ? `Rp ${k.penghasilan} / bulan` : null,
    }))

    const pendidikanArr = Object.entries(pendidikan)
      .filter(([, v]) => v.nama_sekolah)
      .map(([jenjang, v]) => ({
        jenjang,
        nama_sekolah: v.nama_sekolah || null,
        jurusan: v.jurusan || null,
        bulan_masuk: v.bulan_masuk || null,
        tahun_masuk: v.tahun_masuk ? Number(v.tahun_masuk) : null,
        bulan_lulus: v.bulan_lulus || null,
        tahun_lulus: v.tahun_lulus ? Number(v.tahun_lulus) : null,
        ijazah_file: pendidikanIjazah[jenjang]?.name || null,
      }))

    const pengalamanArr = pengalaman.map(p => ({
      nama_perusahaan: p.nama_perusahaan || null,
      alamat_perusahaan: p.alamat_perusahaan || null,
      posisi: p.posisi || null,
      bulan_masuk: p.bulan_masuk || null,
      tahun_masuk: p.tahun_masuk ? Number(p.tahun_masuk) : null,
      bulan_keluar: p.bulan_keluar || null,
      tahun_keluar: p.tahun_keluar ? Number(p.tahun_keluar) : null,
      masih_bekerja: p.masih_bekerja,
      deskripsi_pekerjaan: p.deskripsi_pekerjaan || null,
      alasan_keluar: p.alasan_keluar || null,
    }))

    return {
      nama_romaji: form.namaRomaji || null,
      nik: form.nik || null,
      nama_katakana: form.namaKatakana || null,
      email: form.email || null,
      cabang_id: cabangList.find(c => c.nama_cabang === form.cabang)?.id ?? null,
      tempat_lahir: form.tempatLahir || null,
      tanggal_lahir: form.tanggalLahir || null,
      umur: toNum(form.umur),
      jenis_kelamin: form.jenisKelamin || null,
      status_pernikahan: form.statusPernikahan || null,
      agama: form.agama || null,
      tinggi_badan: toNum(form.tinggiBadan),
      berat_badan: toNum(form.beratBadan),
      golongan_darah: form.golonganDarah || null,
      tangan_dominan: form.tanganDominan || null,
      ukuran_baju: form.ukuranBaju || null,
      lingkar_pinggang: toNum(form.lingkarPinggang),
      panjang_telapak_kaki: toNum(form.panjangTelapakKaki),
      sim_dimiliki: form.sim || null,
      nomor_hp: form.noHp || null,
      email_kontak: form.email || null,
      kontak_ortu_nama: form.namaOrtu || null,
      kontak_ortu_hp: form.noHpOrtu || null,
      alamat_lengkap: form.alamatLengkap || null,
      alamat_provinsi: form.alamatProvinsi || null,
      alamat_kabupaten: form.alamatKabupaten || null,
      alamat_kecamatan: form.alamatKecamatan || null,
      alamat_desa: form.alamatDesa || null,
      pendidikan_terakhir: form.pendidikanTerakhir || null,
      sudah_vaksin: toBool(form.sudahVaksin),
      kondisi_kesehatan: form.kondisiKesehatan || null,
      catatan_kesehatan: form.catatanKesehatan || null,
      penglihatan_kanan: form.penglihatanKanan || null,
      penglihatan_kiri: form.penglihatanKiri || null,
      berkacamata: toBool(form.berkacamata),
      lensa_kontak: toBool(form.lensaKontak),
      buta_warna: toBool(form.butaWarna),
      jenis_buta_warna: form.jenisButaWarna || null,
      bertato: toBool(form.bertato),
      merokok: toBool(form.merokok),
      minum_alkohol: toBool(form.minumAlkohol),
      riwayat_penyakit: form.riwayatPenyakit || null,
      level_jlpt: form.levelJlpt || null,
      level_jft: form.levelJft || null,
      lama_belajar_jepang: form.lamaBelajarJepang || null,
      level_bahasa_jepang: form.levelBahasaJepang || null,
      id_prometric: form.idPrometric || null,
      password_prometric: form.passwordPrometric || null,
      sertifikat_ssw: Array.from(sswSelected),
      penghasilan_keluarga: toNum(form.penghasilanKeluarga),
      pernah_ke_jepang: toBool(form.pernahKeJepang),
      keluarga_di_jepang: toBool(form.keluargaDiJepang),
      kenalan_di_jepang: toBool(form.kenalanDiJepang),
      tujuan_ke_jepang: form.tujuanKeJepang || null,
      alasan_ke_jepang: form.alasanKeJepang || null,
      cita_cita_setelah_jepang: form.citaCitaSetelahJepang || null,
      rencana_pengiriman_uang: toNum(form.rencanaPengirimanUang),
      kelebihan_diri: form.kelebihanDiri || null,
      kekurangan_diri: form.kekuranganDiri || null,
      hobi: form.hobi || null,
      keahlian: form.keahlian || null,
      bersedia_shift: toBool(form.bersediaShift),
      bersedia_lembur: toBool(form.bersediaLembur),
      bersedia_hari_libur: toBool(form.bersediaHariLibur),
      lama_tinggal_jepang: form.lamaTinggalJepang || null,
      lama_kerja_perusahaan: form.lamaKerjaPerusahaan || null,
      rencana_pulang: form.rencanaPulang || null,
      sumber_biaya: form.sumberBiaya || null,
      biaya_disiapkan: form.biayaDisiapkan || null,
      status_formulir: final ? 'submitted' : 'draft',
      status_progres: 'Pending',
      pendidikan: pendidikanArr,
      pengalaman: pengalamanArr,
      keluarga,
    }
  }

  const kirim = async (final = false) => {
    if (!form.namaRomaji || !form.email) {
      Swal.fire({ icon: 'warning', title: 'Data belum lengkap', text: 'Nama Lengkap dan Email wajib diisi.', confirmButtonColor: '#0E6187' })
      setActiveStep(0)
      return
    }
    setSending(true)
    try {
      const payload = { ...buildPayload(final), penempatan_kandidat_id: kandidatId ?? undefined }
      const res = adminKandidatId
        ? await api.post(`/kandidat/${adminKandidatId}/matching-job`, payload)
        : await api.post('/siswa/data-diri', payload)
      if (!res.data?.success) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal menyimpan',
          text: res.data?.message || 'Terjadi kesalahan pada Sistem Penempatan.',
          confirmButtonColor: '#0E6187',
        })
        return
      }

      const savedId: number | undefined = kandidatId ?? res.data?.data?.id
      if (savedId) setKandidatId(savedId)
      setStatusFormulir(res.data?.data?.status_formulir || (final ? 'submitted' : 'draft'))
      const uploads: { jenis: string; file: File }[] = []

      dokumenList.forEach(d => {
        const f = dokumen[d.jenis]
        if (f) uploads.push({ jenis: d.jenis, file: f })
      })
      sswCert.forEach((f, i) => uploads.push({ jenis: `ssw_${i + 1}`, file: f }))

      ;(['SD', 'SMP', 'SMA/SMK', 'Perguruan Tinggi'] as const).forEach(lv => {
        const f = pendidikanIjazah[lv]
        if (f) uploads.push({ jenis: lv === 'SMA/SMK' ? 'ijazah_sma' : lv === 'Perguruan Tinggi' ? 'ijazah_pt' : `ijazah_${lv.toLowerCase()}`, file: f })
      })

      Object.entries(pengalamanPaklaring).forEach(([idx, f]) => {
        if (f) uploads.push({ jenis: `paklaring_${Number(idx) + 1}`, file: f })
      })

      let uploaded = 0
      const errors: string[] = []
      if (savedId && uploads.length > 0) {
        for (const u of uploads) {
          try {
            const fd = new FormData()
            fd.append('file', u.file)
            const up = await api.post(`/penempatan/kandidat/${savedId}/upload-dokumen?jenis_dokumen=${u.jenis}`, fd)
            if (up.data?.success) uploaded++
            else errors.push(`${u.jenis}: ${up.data?.message || 'gagal'}`)
          } catch (e: any) {
            errors.push(`${u.jenis}: ${e?.response?.data?.message || 'gagal terhubung'}`)
          }
        }
      }
      const dokumenMsg = uploads.length === 0
        ? ''
        : errors.length === 0
          ? ` ${uploads.length} dokumen berhasil diupload.`
          : ` ${uploaded}/${uploads.length} dokumen diupload (${errors.join('; ')}).`
      Swal.fire({
        icon: errors.length === uploads.length && uploads.length > 0 ? 'warning' : 'success',
        title: final ? 'Formulir Terkirim' : 'Tersimpan',
        text: final
          ? 'Data matching job Anda berhasil dikirim ke Sistem Penempatan.' + dokumenMsg
          : 'Data berhasil disimpan sebagai draft di Sistem Penempatan.' + dokumenMsg,
        confirmButtonColor: '#0E6187',
      })
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal terhubung',
        text: err?.response?.data?.message || 'Tidak dapat menghubungi Sistem Penempatan.',
        confirmButtonColor: '#0E6187',
      })
    } finally {
      setSending(false)
    }
  }

  const bottomNav = [
    { label: 'Dashboard', to: '/siswa-dashboard', icon: LayoutDashboard },
    { label: 'Kelas Mendunia', to: '/siswa-dashboard/lms', icon: BookOpen },
    { label: 'Absensi', to: '/siswa-dashboard/absensi', icon: CalendarCheck },
    { label: 'Pembayaran', to: '/siswa-dashboard/pembayaran', icon: Wallet },
    { label: 'Profil', to: '/siswa-dashboard/profil', icon: User },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const progressPct = Math.round(((activeStep + 1) / steps.length) * 100)

  return (
    <div className={`min-h-screen bg-[#f0f2f5] ${adminKandidatId ? 'pb-8' : 'pb-24 lg:pb-8'}`}>
      {/* ============ Top App Bar ============ */}
      {adminKandidatId ? (
      <header className="border-b border-slate-200 bg-white px-4 pb-6 pt-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E6187]/10">
              <ClipboardList size={20} className="text-[#0E6187]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Data Job Matching Kandidat</h1>
              <p className="mt-0.5 text-xs text-slate-500">Lengkapi data job matching untuk kandidat ini (diisi admin)</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Langkah {activeStep + 1} dari {steps.length}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-[#0E6187] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>
      ) : (
      <header className="bg-[#0E6187] px-4 pb-9 pt-5 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <Link
              to="/siswa-dashboard"
              aria-label="Kembali ke dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <ChevronLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <img src="/logo-sm1.png" alt="Kelas Mendunia" className="h-8 w-auto" />
            </div>
            <div className="w-9" />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Data Diri</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Lengkapi Data Diri Anda untuk persiapan kerja ke Jepang</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-teal-100">
              <span>Langkah {activeStep + 1} dari {steps.length}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-1.5 rounded-full bg-white transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>
      )}

      <div className={`mx-auto space-y-4 px-4 ${adminKandidatId ? 'max-w-3xl pt-5' : '-mt-5 max-w-lg'}`}>
        {/* ============ Info Pengisian Data ============ */}
        {!adminKandidatId && (
        <div className="overflow-hidden rounded-xl border border-[#0E6187]/15 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#0E6187]/10 bg-gradient-to-r from-[#0E6187]/10 to-white px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0E6187] text-white">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#0E6187]">Keterangan Pengisian Data</p>
              <p className="text-[10px] text-slate-500">Panduan sebelum mengisi formulir</p>
            </div>
          </div>
          <div className="space-y-2.5 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={11} />
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Seluruh data Anda aman dan dilindungi, bersifat rahasia, serta hanya digunakan untuk
                keperluan penempatan kerja di Jepang.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={11} />
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Lengkapi seluruh data secara akurat agar proses verifikasi berjalan lancar dan
                tidak menghambat keberangkatan Anda.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={11} />
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Anda dapat menyimpan data sebagai draft dan melanjutkan pengisian kembali kapan saja.
              </p>
            </div>
          </div>
          <div className="bg-emerald-50/70 px-4 py-2">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
              <Lock size={11} />
              Informasi pribadi Anda terlindungi dan tidak akan disalahgunakan.
            </p>
          </div>
        </div>
        )}

        {/* ============ Step Pills ============ */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <div className="flex min-w-max items-stretch gap-2">
            {steps.map((s, i) => {
              const active = activeStep === i
              const done = i < activeStep
              return (
                <button
                  key={s.label}
                  onClick={() => goToStep(i)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                    active ? 'bg-[#0E6187] text-white shadow-sm'
                      : done ? 'bg-white text-[#0E6187] shadow-sm hover:bg-[#0E6187]/5'
                        : 'bg-white/70 text-slate-500 hover:bg-white'
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/20' : done ? 'bg-[#0E6187]/10' : 'bg-slate-100'
                  }`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ============ Form Card ============ */}
        <div id="dataForm" className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        {activeStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-sm font-bold text-slate-800">{adminKandidatId ? '1. Data Diri' : 'DATA DIRI（個人情報）'}</h2>
              <p className="mb-4 text-xs text-slate-400">Informasi pribadi kandidat</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cabang Mendunia" required error={errors.cabang}>
                  <select className={inputCls} value={form.cabang} onChange={set('cabang')}>
                    <option value="">Pilih cabang...</option>
                    {cabangList.map(c => <option key={c.id} value={c.nama_cabang}>{c.nama_cabang}</option>)}
                  </select>
                </Field>
                <Field label="NIK" required error={errors.nik}><input className={inputCls} placeholder="16 digit NIK" maxLength={16} value={form.nik} onChange={set('nik')} /></Field>
                <Field label="Nama (Katakana)" required error={errors.namaKatakana}><input className={inputCls} placeholder="カタカナ" value={form.namaKatakana} onChange={set('namaKatakana')} /></Field>
                <Field label="Nama Lengkap" required error={errors.namaRomaji}><input className={inputCls} placeholder="Nama lengkap sesuai KTP" value={form.namaRomaji} onChange={set('namaRomaji')} /></Field>
                <Field label="Tempat Lahir (Sesuai KTP)" required error={errors.tempatLahir}><input className={inputCls} placeholder="Kota lahir sesuai KTP" value={form.tempatLahir} onChange={set('tempatLahir')} /></Field>
                <Field label="Tanggal Lahir (Sesuai KTP)" required error={errors.tanggalLahir}><input type="date" className={inputCls} value={form.tanggalLahir} onChange={set('tanggalLahir')} /></Field>
                <Field label="Umur" required error={errors.umur}><input type="number" className={inputCls} placeholder="25" value={form.umur} onChange={set('umur')} /></Field>
                <Field label="Jenis Kelamin" required error={errors.jenisKelamin}>
                  <select className={inputCls} value={form.jenisKelamin} onChange={set('jenisKelamin')}><option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option></select>
                </Field>
                <Field label="Status Pernikahan" required error={errors.statusPernikahan}>
                  <select className={inputCls} value={form.statusPernikahan} onChange={set('statusPernikahan')}><option value="">Pilih...</option><option>Belum Menikah</option><option>Menikah</option><option>Cerai Hidup</option><option>Cerai Mati</option></select>
                </Field>
                <Field label="Agama" required error={errors.agama}>
                  <select className={inputCls} value={form.agama} onChange={set('agama')}><option value="">Pilih...</option><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select>
                </Field>
                <Field label="Tinggi Badan (cm)" required error={errors.tinggiBadan}><input type="number" className={inputCls} placeholder="165" value={form.tinggiBadan} onChange={set('tinggiBadan')} /></Field>
                <Field label="Berat Badan (kg)" required error={errors.beratBadan}><input type="number" className={inputCls} placeholder="60" value={form.beratBadan} onChange={set('beratBadan')} /></Field>
                <Field label="Golongan Darah" required error={errors.golonganDarah}>
                  <select className={inputCls} value={form.golonganDarah} onChange={set('golonganDarah')}><option value="">Pilih...</option><option>A</option><option>B</option><option>AB</option><option>O</option></select>
                </Field>
                <Field label="Tangan Dominan" required error={errors.tanganDominan}>
                  <select className={inputCls} value={form.tanganDominan} onChange={set('tanganDominan')}><option value="">Pilih...</option><option>Kanan</option><option>Kiri</option></select>
                </Field>
                <Field label="Ukuran Baju" required error={errors.ukuranBaju}>
                  <select className={inputCls} value={form.ukuranBaju} onChange={set('ukuranBaju')}><option value="">Pilih...</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                </Field>
                <Field label="Lingkar Pinggang (cm)"><input type="number" className={inputCls} placeholder="80" value={form.lingkarPinggang} onChange={set('lingkarPinggang')} /></Field>
                <Field label="Panjang Telapak Kaki (cm)"><input type="number" className={inputCls} placeholder="25.5" value={form.panjangTelapakKaki} onChange={set('panjangTelapakKaki')} /></Field>
                <Field label="SIM yang Dimiliki">
                  <select className={inputCls} value={form.sim} onChange={set('sim')}>
                    <option value="">Pilih...</option>
                    <option>SIM A</option>
                    <option>SIM B1</option>
                    <option>SIM B2</option>
                    <option>SIM C</option>
                    <option>SIM D</option>
                    <option>SIM Internasional</option>
                    <option>Tidak Punya SIM</option>
                  </select>
                </Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? 'Kontak & Alamat' : '📍 KONTAK &amp; ALAMAT'}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nomor HP" required error={errors.noHp}><input className={inputCls} placeholder="08xx-xxxx-xxxx" value={form.noHp} onChange={set('noHp')} /></Field>
                <Field label="Email Kontak" required error={errors.email}><input type="email" className={inputCls} placeholder="email@..." value={form.email} onChange={set('email')} /></Field>
                <Field label="Nama Orang Tua / Wali" required error={errors.namaOrtu}><input className={inputCls} placeholder="Nama" value={form.namaOrtu} onChange={set('namaOrtu')} /></Field>
                <Field label="No. HP Orang Tua" required error={errors.noHpOrtu}><input className={inputCls} placeholder="08xx-xxxx-xxxx" value={form.noHpOrtu} onChange={set('noHpOrtu')} /></Field>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Provinsi" error={errors.alamatProvinsi}>
                  <select
                    className={inputCls}
                    value={findIdByName(provinsiList, form.alamatProvinsi)}
                    disabled={wilayahLoading.provinsi}
                    onChange={e => {
                      const id = e.target.value
                      const found = provinsiList.find(p => p.id === id)
                      setForm(f => ({ ...f, alamatProvinsi: found?.name || '', alamatKabupaten: '', alamatKecamatan: '', alamatDesa: '' }))
                    }}
                  >
                    <option value="">{wilayahLoading.provinsi ? 'Memuat...' : 'Pilih Provinsi'}</option>
                    {provinsiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Kabupaten / Kota" error={errors.alamatKabupaten}>
                  <select
                    className={inputCls}
                    value={findIdByName(kabupatenList, form.alamatKabupaten)}
                    disabled={!form.alamatProvinsi || wilayahLoading.kabupaten}
                    onChange={e => {
                      const id = e.target.value
                      const found = kabupatenList.find(k => k.id === id)
                      setForm(f => ({ ...f, alamatKabupaten: found?.name || '', alamatKecamatan: '', alamatDesa: '' }))
                    }}
                  >
                    <option value="">{!form.alamatProvinsi ? 'Pilih Provinsi dulu' : wilayahLoading.kabupaten ? 'Memuat...' : 'Pilih Kabupaten/Kota'}</option>
                    {kabupatenList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </Field>
                <Field label="Kecamatan" error={errors.alamatKecamatan}>
                  <select
                    className={inputCls}
                    value={findIdByName(kecamatanList, form.alamatKecamatan)}
                    disabled={!form.alamatKabupaten || wilayahLoading.kecamatan}
                    onChange={e => {
                      const id = e.target.value
                      const found = kecamatanList.find(k => k.id === id)
                      setForm(f => ({ ...f, alamatKecamatan: found?.name || '', alamatDesa: '' }))
                    }}
                  >
                    <option value="">{!form.alamatKabupaten ? 'Pilih Kabupaten dulu' : wilayahLoading.kecamatan ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                    {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </Field>
                <Field label="Desa / Kelurahan" error={errors.alamatDesa}>
                  <select
                    className={inputCls}
                    value={findIdByName(desaList, form.alamatDesa)}
                    disabled={!form.alamatKecamatan || wilayahLoading.desa}
                    onChange={e => {
                      const id = e.target.value
                      const found = desaList.find(d => d.id === id)
                      setForm(f => ({ ...f, alamatDesa: found?.name || '' }))
                    }}
                  >
                    <option value="">{!form.alamatKecamatan ? 'Pilih Kecamatan dulu' : wilayahLoading.desa ? 'Memuat...' : 'Pilih Desa/Kelurahan'}</option>
                    {desaList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Alamat Lengkap (detail, RT/RW & no. rumah)" required error={errors.alamatLengkap}>
                  <textarea className={`${inputCls} min-h-[70px]`} placeholder="Jl. ..., RT/RW ..." value={form.alamatLengkap} onChange={set('alamatLengkap')} />
                </Field>
                </div>
              </div>
            </div>
        )}

        {activeStep === 1 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '2. Kondisi Fisik & Kesehatan' : 'KONDISI FISIK &amp; KESEHATAN'}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <YesNo label="Sudah Vaksin?" required value={form.sudahVaksin} error={errors.sudahVaksin} onChange={v => { setForm(f => ({ ...f, sudahVaksin: v })); clearErrors(['sudahVaksin', 'kondisiKesehatan', 'berkacamata', 'lensaKontak', 'butaWarna', 'bertato', 'merokok', 'minumAlkohol', 'riwayatPenyakit']) }} />
              <Field label="Kondisi Kesehatan Saat Ini" required error={errors.kondisiKesehatan}>
                <select className={inputCls} value={form.kondisiKesehatan} onChange={e => { set('kondisiKesehatan')(e); clearErrors(['catatanKesehatan']) }}><option value="">Pilih...</option><option>Sehat</option><option>Sehat dengan catatan</option></select>
              </Field>
              {form.kondisiKesehatan === 'Sehat dengan catatan' && (
                <div className="sm:col-span-3">
                  <Field label="Catatan Kondisi Kesehatan" required error={errors.catatanKesehatan}>
                    <textarea className={`${inputCls} min-h-[70px]`} placeholder="Jelaskan catatan kondisi kesehatan Anda..." value={form.catatanKesehatan} onChange={set('catatanKesehatan')} />
                  </Field>
                </div>
              )}
              <Field label="Penglihatan Kanan"><input className={inputCls} placeholder="Normal / Minus -2.5" value={form.penglihatanKanan} onChange={set('penglihatanKanan')} /></Field>
              <Field label="Penglihatan Kiri"><input className={inputCls} placeholder="Normal / Minus -1.5" value={form.penglihatanKiri} onChange={set('penglihatanKiri')} /></Field>
              <YesNo label="Berkacamata?" required value={form.berkacamata} error={errors.berkacamata} onChange={v => setForm(f => ({ ...f, berkacamata: v }))} />
              <YesNo label="Menggunakan Lensa Kontak?" required value={form.lensaKontak} error={errors.lensaKontak} onChange={v => setForm(f => ({ ...f, lensaKontak: v }))} />
              <YesNo label="Buta Warna?" required value={form.butaWarna} error={errors.butaWarna} onChange={v => { setForm(f => ({ ...f, butaWarna: v, jenisButaWarna: '' })); clearErrors(['jenisButaWarna']) }} />
              {form.butaWarna === 'Ya' && (
                <Field label="Jenis Buta Warna" required error={errors.jenisButaWarna}>
                  <select className={inputCls} value={form.jenisButaWarna} onChange={set('jenisButaWarna')}>
                    <option value="">Pilih...</option>
                    <option>Parsial</option>
                    <option>Total</option>
                  </select>
                </Field>
              )}
              <YesNo label="Bertato?" required value={form.bertato} error={errors.bertato} onChange={v => setForm(f => ({ ...f, bertato: v }))} />
              <YesNo label="Merokok?" required value={form.merokok} error={errors.merokok} onChange={v => setForm(f => ({ ...f, merokok: v }))} />
              <YesNo label="Minum Alkohol?" required value={form.minumAlkohol} error={errors.minumAlkohol} onChange={v => setForm(f => ({ ...f, minumAlkohol: v }))} />
              <div className="sm:col-span-3">
                <Field label="Riwayat Penyakit / Cedera" required error={errors.riwayatPenyakit}>
                  <textarea className={`${inputCls} min-h-[70px]`} placeholder="Cedera, patah tulang, penyakit kronis, dll. Isi 'Tidak ada' jika tidak ada." value={form.riwayatPenyakit} onChange={set('riwayatPenyakit')} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '3. Pendidikan' : 'PENDIDIKAN（学歴）'}</h2>
            <div className="mb-5 max-w-sm">
              <Field label="Pendidikan Terakhir" required error={errors.pendidikanTerakhir}>
                  <select className={inputCls} value={form.pendidikanTerakhir} onChange={set('pendidikanTerakhir')}>
                    <option value="">Pilih pendidikan terakhir...</option>
                    <option>SD / Sederajat</option>
                    <option>SMP / Sederajat</option>
                    <option>SMA / SMK / MA / Sederajat</option>
                    <option>Paket A / B / C</option>
                    <option>Diploma I / II / III / IV (D1–D4)</option>
                    <option>Sarjana (S1)</option>
                    <option>Magister (S2)</option>
                    <option>Doktor (S3)</option>
                  </select>
                </Field>
            </div>
            <div className="space-y-4">
              <EducationBlock title="SD" required value={pendidikan.SD} onChange={v => { setPendidikan(p => ({ ...p, SD: v })); clearStepErrors(2) }} getError={k => errors[`SD.${k}`]} ijazah={pendidikanIjazah.SD} onIjazah={f => { setPendidikanIjazah(p => ({ ...p, SD: f })); clearStepErrors(2) }} />
              <EducationBlock title="SMP" required value={pendidikan.SMP} onChange={v => { setPendidikan(p => ({ ...p, SMP: v })); clearStepErrors(2) }} getError={k => errors[`SMP.${k}`]} ijazah={pendidikanIjazah.SMP} onIjazah={f => { setPendidikanIjazah(p => ({ ...p, SMP: f })); clearStepErrors(2) }} />
              <EducationBlock title="SMA/SMK" value={pendidikan['SMA/SMK']} onChange={v => setPendidikan(p => ({ ...p, 'SMA/SMK': v }))} ijazah={pendidikanIjazah['SMA/SMK']} onIjazah={f => setPendidikanIjazah(p => ({ ...p, 'SMA/SMK': f }))} />
              <EducationBlock title="Perguruan Tinggi" value={pendidikan['Perguruan Tinggi']} onChange={v => setPendidikan(p => ({ ...p, 'Perguruan Tinggi': v }))} ijazah={pendidikanIjazah['Perguruan Tinggi']} onIjazah={f => setPendidikanIjazah(p => ({ ...p, 'Perguruan Tinggi': f }))} />
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '4. Pengalaman Kerja' : 'PENGALAMAN KERJA（職歴）'}</h2>
            <button
              onClick={() => setPengalaman(prev => [...prev, emptyPengalaman()])}
              className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#0a4a6a]"
            >
              <Plus size={14} />
              Tambah
            </button>
            {pengalaman.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                Belum ada pengalaman kerja
              </p>
            ) : (
              <div className="space-y-4">
                {pengalaman.map((p, i) => (
                  <ExperienceCard key={i} value={p} onChange={v => { setPengalaman(prev => prev.map((x, xI) => xI === i ? v : x)); clearStepErrors(3) }} onRemove={() => setPengalaman(prev => prev.filter((_, xI) => xI !== i))} getError={k => errors[`pengalaman.${i}.${k}`]} paklaring={pengalamanPaklaring[i] || null} onPaklaring={f => { setPengalamanPaklaring(prev => ({ ...prev, [i]: f })); clearStepErrors(3) }} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeStep === 4 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '5. Kemampuan & Sertifikat' : 'KEMAMPUAN &amp; SERTIFIKAT'}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Level JLPT" required error={errors.levelJlpt}>
                <select className={inputCls} value={form.levelJlpt} onChange={set('levelJlpt')}><option value="">Pilih level...</option><option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>N1</option></select>
              </Field>
              <Field label="Level JFT (opsional)">
                <select className={inputCls} value={form.levelJft} onChange={set('levelJft')}><option value="">Pilih level...</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select>
              </Field>
              <Field label="Lama Belajar Bahasa Jepang" required error={errors.lamaBelajarJepang}><input className={inputCls} placeholder="6 bulan, 1 tahun, dll." value={form.lamaBelajarJepang} onChange={set('lamaBelajarJepang')} /></Field>
              <Field label="Level Bahasa Jepang" required error={errors.levelBahasaJepang}>
                <select className={inputCls} value={form.levelBahasaJepang} onChange={set('levelBahasaJepang')}><option value="">Pilih...</option><option>Dasar</option><option>Menengah</option><option>Lancar</option></select>
              </Field>
              <Field label="ID Prometric (opsional)"><input className={inputCls} placeholder="ID Prometric" value={form.idPrometric} onChange={set('idPrometric')} /></Field>
              <Field label="Password Prometric (opsional)"><input className={inputCls} placeholder="Password" value={form.passwordPrometric} onChange={set('passwordPrometric')} /></Field>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-slate-600">Sertifikat SSW yang Dimiliki (opsional)</p>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {sswFields.map(f => {
                  const on = sswSelected.has(f)
                  return (
                    <label
                      key={f}
                      onClick={() => toggleSsw(f)}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
                        on ? 'border-[#0E6187] bg-[#0E6187]/5 text-[#0E6187]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-white ${on ? 'border-[#0E6187] bg-[#0E6187]' : 'border-slate-300 bg-white'}`}>
                        {on && '✓'}
                      </span>
                      {f}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '6. Data Keluarga' : 'DATA KELUARGA（家族構成）'}</h2>
            <div className="mb-5 max-w-sm">
              <Field label="Penghasilan Keluarga / Bulan (Rp)" required error={errors.penghasilanKeluarga}>
                <input type="number" className={inputCls} placeholder="5000000" value={form.penghasilanKeluarga} onChange={set('penghasilanKeluarga')} />
              </Field>
            </div>
            <div className="space-y-4">
              <FamilyMemberCard title="Ayah" hubungan="Ayah" required value={ayah} onChange={v => { setAyah(v); clearStepErrors(5) }} getError={k => errors[`Ayah.${k}`]} />
              <FamilyMemberCard title="Ibu" hubungan="Ibu" required value={ibu} onChange={v => { setIbu(v); clearStepErrors(5) }} getError={k => errors[`Ibu.${k}`]} />
              <MultiFamily title="Suami" addLabel="Tambah Suami" values={suami} onChange={setSuami} />
              <MultiFamily title="Istri" addLabel="Tambah Istri" values={istri} onChange={setIstri} />
              <MultiFamily title="Kakak" addLabel="Tambah Kakak" values={kakak} onChange={setKakak} />
              <MultiFamily title="Adik" addLabel="Tambah Adik" values={adik} onChange={setAdik} />
            </div>
          </div>
        )}

        {activeStep === 6 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '7. Informasi Jepang' : 'INFORMASI JEPANG'}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <YesNo label="Pernah ke Jepang?" required value={form.pernahKeJepang} error={errors.pernahKeJepang} onChange={v => setForm(f => ({ ...f, pernahKeJepang: v }))} />
              <YesNo label="Punya Keluarga di Jepang?" required value={form.keluargaDiJepang} error={errors.keluargaDiJepang} onChange={v => setForm(f => ({ ...f, keluargaDiJepang: v }))} />
              <YesNo label="Punya Kenalan di Jepang?" required value={form.kenalanDiJepang} error={errors.kenalanDiJepang} onChange={v => setForm(f => ({ ...f, kenalanDiJepang: v }))} />
            </div>
          </div>
        )}

        {activeStep === 7 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">{adminKandidatId ? '8. Motivasi, Tujuan & Poin Pendukung' : 'MOTIVASI, TUJUAN &amp; POIN PENDUKUNG'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tujuan ke Jepang" required error={errors.tujuanKeJepang}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Tuliskan tujuan Anda pergi ke Jepang..." value={form.tujuanKeJepang} onChange={set('tujuanKeJepang')} /></Field>
              <Field label="Alasan Ingin ke Jepang" required error={errors.alasanKeJepang}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Alasan Anda..." value={form.alasanKeJepang} onChange={set('alasanKeJepang')} /></Field>
              <Field label="Cita-cita Setelah Pulang dari Jepang" required error={errors.citaCitaSetelahJepang}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Cita-cita..." value={form.citaCitaSetelahJepang} onChange={set('citaCitaSetelahJepang')} /></Field>
              <Field label="Rencana Pengiriman Uang/Bulan ke Indonesia (Rp)" required error={errors.rencanaPengirimanUang}><input type="number" className={inputCls} placeholder="3000000" value={form.rencanaPengirimanUang} onChange={set('rencanaPengirimanUang')} /></Field>
              <Field label="Kelebihan Diri" required error={errors.kelebihanDiri}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Kelebihan Anda..." value={form.kelebihanDiri} onChange={set('kelebihanDiri')} /></Field>
              <Field label="Kekurangan Diri" required error={errors.kekuranganDiri}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Kekurangan Anda..." value={form.kekuranganDiri} onChange={set('kekuranganDiri')} /></Field>
              <Field label="Hobi" required error={errors.hobi}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Hobi Anda..." value={form.hobi} onChange={set('hobi')} /></Field>
              <Field label="Keahlian" required error={errors.keahlian}><textarea className={`${inputCls} min-h-[70px]`} placeholder="Keahlian Anda..." value={form.keahlian} onChange={set('keahlian')} /></Field>
              <YesNo label="Bersedia Kerja Shift?" required value={form.bersediaShift} error={errors.bersediaShift} onChange={v => setForm(f => ({ ...f, bersediaShift: v }))} />
              <YesNo label="Bersedia Lembur?" required value={form.bersediaLembur} error={errors.bersediaLembur} onChange={v => setForm(f => ({ ...f, bersediaLembur: v }))} />
              <YesNo label="Bersedia Kerja Hari Libur?" required value={form.bersediaHariLibur} error={errors.bersediaHariLibur} onChange={v => setForm(f => ({ ...f, bersediaHariLibur: v }))} />
              <Field label="Lama Ingin Tinggal di Jepang" required error={errors.lamaTinggalJepang}>
                <select className={inputCls} value={form.lamaTinggalJepang} onChange={set('lamaTinggalJepang')}><option value="">Pilih...</option><option>2-3 tahun</option><option>3-5 tahun</option></select>
              </Field>
              <Field label="Lama Ingin Bekerja di Perusahaan" required error={errors.lamaKerjaPerusahaan}>
                <select className={inputCls} value={form.lamaKerjaPerusahaan} onChange={set('lamaKerjaPerusahaan')}><option value="">Pilih...</option><option>1-2 tahun</option><option>2-3 tahun</option><option>3-5 tahun</option></select>
              </Field>
              <Field label="Rencana Pulang ke Indonesia (5 tahun)" required error={errors.rencanaPulang}>
                <select className={inputCls} value={form.rencanaPulang} onChange={set('rencanaPulang')}><option value="">Pilih...</option><option>1-2 kali</option><option>3-4 kali</option><option>Lainnya</option></select>
              </Field>
              <Field label="Sumber Biaya Keberangkatan" required error={errors.sumberBiaya}>
                <select className={inputCls} value={form.sumberBiaya} onChange={set('sumberBiaya')}><option value="">Pilih...</option><option>Dana Pribadi</option><option>Dana Talang LPK</option></select>
              </Field>
              <Field label="Biaya yang Disiapkan" required error={errors.biayaDisiapkan}>
                <select className={inputCls} value={form.biayaDisiapkan} onChange={set('biayaDisiapkan')}><option value="">Pilih...</option><option>10-20 Juta</option><option>20-30 Juta</option><option>40-50 Juta</option><option>Lainnya</option></select>
              </Field>
            </div>
          </div>
        )}

        {activeStep === 8 && (
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-800">{adminKandidatId ? '9. Upload Dokumen Pendukung' : 'UPLOAD DOKUMEN PENDUKUNG'}</h2>
            <div className="mb-5 rounded-lg bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
              <p className="mb-1 font-semibold">Batas ukuran file:</p>
              <p>• Dokumen standar: Maks 500KB</p>
              <p>• Foto Full Body: Maks 3MB</p>
              <p>• Video Perkenalan: Maks 20MB</p>
              <p className="mt-1">Format: JPG, PNG, PDF, MP4. Dokumen dengan tanda * wajib diupload.</p>
            </div>
            <div className="space-y-3">
              {dokumenList.map(d => (
                <UploadRow
                  key={d.jenis}
                  label={d.label}
                  required={d.required}
                  note={`Maks ${d.maxKB >= 1000 ? `${Math.round(d.maxKB / 1000)}MB` : `${d.maxKB}KB`}`}
                  maxKB={d.maxKB}
                  file={dokumen[d.jenis] || null}
                  onFileChange={f => { setDokumen(prev => ({ ...prev, [d.jenis]: f })); clearStepErrors(8) }}
                  error={errors[`dokumen.${d.jenis}`]}
                />
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Sertifikat SSW (Opsional)</p>
                <button
                  onClick={() => setSswCert(prev => [...prev, new File([], '')])}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Plus size={13} />
                  Tambah
                </button>
              </div>
              <div className="space-y-3">
                {sswCert.map((file, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Sertifikat SSW #{i + 1}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {file.name ? (
                        <span className="max-w-[220px] truncate text-xs text-slate-500">{file.name}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Belum ada file</span>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSswCert(prev => prev.filter((_, x) => x !== i))}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                          <Upload size={13} />
                          Pilih File
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0] || null
                              if (f && f.size > 500 * 1024) {
                                Swal.fire({ icon: 'warning', title: 'File terlalu besar', text: 'Ukuran maks 500KB untuk sertifikat SSW.', confirmButtonColor: '#0E6187' })
                                e.target.value = ''
                                return
                              }
                              setSswCert(prev => prev.map((x, xI) => xI === i ? (f || x) : x))
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                {sswCert.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                    Belum ada sertifikat SSW
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={() => setActiveStep(s => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Kembali
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => kirim(false)}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0E6187]/30 bg-[#0E6187]/5 px-4 py-2.5 text-sm font-semibold text-[#0E6187] transition hover:bg-[#0E6187]/10 disabled:opacity-50"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => handleNext(activeStep + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E6187] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a4a6a]"
              >
                Lanjut
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => handleKirim()}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Kirim Formulir
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* ============ Bottom Nav Bar ============ */}
      {!adminKandidatId && (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link
                key={nav.label}
                to={nav.to}
                className={`flex flex-col items-center gap-1 py-2.5 transition ${
                  isActive ? 'text-[#0E6187]' : 'text-slate-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      )}
    </div>
  )
}
