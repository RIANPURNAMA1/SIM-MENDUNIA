import { useState } from 'react'
import {
  ClipboardList, ChevronLeft, ChevronRight, Save, Send, Upload, Plus, Trash2,
} from 'lucide-react'
import Swal from 'sweetalert2'

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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function YesNo({ placeholder, required }: { placeholder?: string; required?: boolean }) {
  return (
    <Field label={placeholder || 'Pilihan'} required={required}>
      <select className={inputCls}>
        <option value="">Pilih...</option>
        <option value="Ya">Ya</option>
        <option value="Tidak">Tidak</option>
      </select>
    </Field>
  )
}

function MonthYear({ required }: { required?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select className={inputCls} defaultValue="">
        <option value="">Bulan{required ? ' *' : ''}</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className={inputCls} defaultValue="">
        <option value="">Tahun{required ? ' *' : ''}</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

function UploadRow({ label, required, note }: { label: string; required?: boolean; note?: string }) {
  const [fileName, setFileName] = useState('')
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </p>
        {note && <p className="text-[11px] text-slate-400">{note}</p>}
      </div>
      <div className="flex items-center gap-2">
        {fileName ? (
          <span className="max-w-[180px] truncate text-xs text-slate-500">{fileName}</span>
        ) : (
          <span className="text-xs text-slate-400">Belum ada file</span>
        )}
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
          <Upload size={13} />
          Upload
          <input type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
        </label>
      </div>
    </div>
  )
}

function ExperienceCard({ onRemove }: { onRemove: () => void }) {
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
        <Field label="Nama Perusahaan" required><input className={inputCls} placeholder="Nama perusahaan" /></Field>
        <Field label="Posisi / Jabatan" required><input className={inputCls} placeholder="Posisi" /></Field>
        <Field label="Periode Masuk" required><MonthYear required /></Field>
        <Field label="Periode Keluar" required><MonthYear required /></Field>
        <div className="sm:col-span-2">
          <Field label="Deskripsi Pekerjaan">
            <textarea className={`${inputCls} min-h-[70px]`} placeholder="Tugas dan tanggung jawab..." />
          </Field>
        </div>
      </div>
    </div>
  )
}

function FamilyMemberCard({ title, required, placeholder }: { title: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama" required={required}><input className={inputCls} placeholder={placeholder || 'Nama'} /></Field>
        <Field label="Usia" required={required}><input className={inputCls} placeholder="Usia" /></Field>
        <Field label="Pekerjaan" required={required}><input className={inputCls} placeholder="Pekerjaan" /></Field>
        <Field label="Penghasilan/Bulan" required={required}>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-500">Rp</span>
            <input className={`${inputCls} rounded-l-none`} placeholder="0" />
          </div>
        </Field>
      </div>
    </div>
  )
}

function MultiFamily({ title, addLabel, required }: { title: string; addLabel: string; required?: boolean }) {
  const [count, setCount] = useState(0)
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title} {required && <span className="text-red-500">*</span>}</p>
        <button onClick={() => setCount(c => c + 1)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
          <Plus size={13} />
          {addLabel}
        </button>
      </div>
      {count === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
          Belum ada. Klik tombol untuk menambah.
        </p>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">{title} #{i + 1}</p>
                <button onClick={() => setCount(c => c - 1)} className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600">
                  <Trash2 size={12} />
                  Hapus
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Nama" />
                <input className={inputCls} placeholder="Usia" />
                <input className={inputCls} placeholder="Pekerjaan" />
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-500">Rp</span>
                  <input className={`${inputCls} rounded-l-none`} placeholder="0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EducationBlock({ title, required }: { title: string; required?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nama Sekolah / Universitas" required={required}>
            <input className={inputCls} placeholder={title} />
          </Field>
        </div>
        {title === 'SMA/SMK' || title === 'Perguruan Tinggi' ? (
          <div className="sm:col-span-2">
            <Field label="Jurusan">
              <input className={inputCls} placeholder="Jurusan / Prodi" />
            </Field>
          </div>
        ) : null}
        <Field label="Bulan & Tahun Masuk" required={required}><MonthYear required={required} /></Field>
        <Field label="Bulan & Tahun Lulus" required={required}><MonthYear required={required} /></Field>
      </div>
    </div>
  )
}

export default function MatchingJobForm() {
  const [activeStep, setActiveStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [pengalaman, setPengalaman] = useState<number[]>([])
  const [sswSelected, setSswSelected] = useState<Set<string>>(new Set())
  const [sswCert, setSswCert] = useState<number[]>([])

  const toggleSsw = (f: string) => {
    setSswSelected(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const kirim = () => {
    setSubmitted(true)
    Swal.fire({
      icon: 'success',
      title: 'Formulir Terkirim',
      text: 'Data matching job Anda berhasil dikirim (dummy).',
      confirmButtonColor: '#0E6187',
    })
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Formulir Pendaftaran</h1>
              <p className="text-sm text-slate-500">Isi data lengkap untuk matching pekerjaan terbaik di Jepang</p>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${submitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${submitted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {submitted ? 'Terkirim' : 'Belum dikirim'}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {steps.map((s, i) => {
            const active = activeStep === i
            const done = i < activeStep
            return (
              <button
                key={s.label}
                onClick={() => setActiveStep(i)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active ? 'bg-[#0E6187] text-white shadow-sm'
                    : done ? 'text-[#0E6187] hover:bg-blue-50'
                      : 'text-slate-500 hover:bg-slate-100'
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

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {activeStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-sm font-bold text-slate-800">DATA DIRI（個人情報）</h2>
              <p className="mb-4 text-xs text-slate-400">Informasi pribadi kandidat</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cabang Mendunia" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih cabang...</option><option>Cianjur</option><option>Bandung</option></select>
                </Field>
                <Field label="Nama (Katakana)" required><input className={inputCls} placeholder="カタカナ" /></Field>
                <Field label="Nama (Romaji)" required><input className={inputCls} placeholder="Nama latin" /></Field>
                <Field label="Tempat Lahir" required><input className={inputCls} placeholder="Kota lahir" /></Field>
                <Field label="Tanggal Lahir" required><input type="date" className={inputCls} /></Field>
                <Field label="Umur" required><input type="number" className={inputCls} placeholder="25" /></Field>
                <Field label="Jenis Kelamin" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option></select>
                </Field>
                <Field label="Status Pernikahan" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Lajang</option><option>Menikah</option><option>Cerai</option><option>Cerai Mati</option></select>
                </Field>
                <Field label="Agama" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select>
                </Field>
                <Field label="Tinggi Badan (cm)" required><input type="number" className={inputCls} placeholder="165" /></Field>
                <Field label="Berat Badan (kg)" required><input type="number" className={inputCls} placeholder="60" /></Field>
                <Field label="Golongan Darah" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>A</option><option>B</option><option>AB</option><option>O</option></select>
                </Field>
                <Field label="Tangan Dominan" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Kanan</option><option>Kiri</option></select>
                </Field>
                <Field label="Ukuran Baju" required>
                  <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                </Field>
                <Field label="Lingkar Pinggang (cm)"><input type="number" className={inputCls} placeholder="80" /></Field>
                <Field label="Panjang Telapak Kaki (cm)"><input type="number" className={inputCls} placeholder="25.5" /></Field>
                <Field label="SIM yang Dimiliki"><input className={inputCls} placeholder="A, C" /></Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-bold text-slate-800">📍 KONTAK &amp; ALAMAT</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nomor HP" required><input className={inputCls} placeholder="08xx-xxxx-xxxx" /></Field>
                <Field label="Email Kontak" required><input type="email" className={inputCls} placeholder="email@..." /></Field>
                <Field label="Nama Orang Tua / Wali" required><input className={inputCls} placeholder="Nama" /></Field>
                <Field label="No. HP Orang Tua" required><input className={inputCls} placeholder="08xx-xxxx-xxxx" /></Field>
                <div className="sm:col-span-3">
                  <Field label="Alamat Lengkap" required>
                    <textarea className={`${inputCls} min-h-[70px]`} placeholder="Jl. ..." />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">KONDISI FISIK &amp; KESEHATAN</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <YesNo placeholder="Sudah Vaksin?" required />
              <Field label="Kondisi Kesehatan Saat Ini" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Sehat</option><option>Sehat dengan catatan</option></select>
              </Field>
              <Field label="Penglihatan Kanan"><input className={inputCls} placeholder="Normal / Minus -2.5" /></Field>
              <Field label="Penglihatan Kiri"><input className={inputCls} placeholder="Normal / Minus -1.5" /></Field>
              <YesNo placeholder="Berkacamata?" required />
              <YesNo placeholder="Menggunakan Lensa Kontak?" required />
              <YesNo placeholder="Buta Warna?" required />
              <YesNo placeholder="Bertato?" required />
              <YesNo placeholder="Merokok?" required />
              <YesNo placeholder="Minum Alkohol?" required />
              <div className="sm:col-span-3">
                <Field label="Riwayat Penyakit / Cedera" required>
                  <textarea className={`${inputCls} min-h-[70px]`} placeholder="Cedera, patah tulang, penyakit kronis, dll. Isi 'Tidak ada' jika tidak ada." />
                </Field>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">PENDIDIKAN（学歴）</h2>
            <div className="mb-5 max-w-sm">
              <Field label="Pendidikan Terakhir" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih pendidikan terakhir...</option><option>SD</option><option>SMP</option><option>SMA/SMK</option><option>D3</option><option>S1</option></select>
              </Field>
            </div>
            <div className="space-y-4">
              <EducationBlock title="SD" required />
              <EducationBlock title="SMP" required />
              <EducationBlock title="SMA/SMK" />
              <EducationBlock title="Perguruan Tinggi" />
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">PENGALAMAN KERJA（職歴）</h2>
            <button
              onClick={() => setPengalaman(prev => [...prev, prev.length])}
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
                {pengalaman.map(id => (
                  <ExperienceCard key={id} onRemove={() => setPengalaman(prev => prev.filter(x => x !== id))} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeStep === 4 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">KEMAMPUAN &amp; SERTIFIKAT</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Level JLPT" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih level...</option><option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>N1</option></select>
              </Field>
              <Field label="Level JFT (opsional)">
                <select className={inputCls} defaultValue=""><option value="">Pilih level...</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select>
              </Field>
              <Field label="Lama Belajar Bahasa Jepang" required><input className={inputCls} placeholder="6 bulan, 1 tahun, dll." /></Field>
              <Field label="Level Bahasa Jepang" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Pemula</option><option>Menengah</option><option>Mahir</option></select>
              </Field>
              <Field label="ID Prometric (opsional)"><input className={inputCls} placeholder="ID Prometric" /></Field>
              <Field label="Password Prometric (opsional)"><input className={inputCls} placeholder="Password" /></Field>
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
            <h2 className="mb-4 text-sm font-bold text-slate-800">DATA KELUARGA（家族構成）</h2>
            <div className="mb-5 max-w-sm">
              <Field label="Penghasilan Keluarga / Bulan (Rp)" required>
                <input type="number" className={inputCls} placeholder="5000000" />
              </Field>
            </div>
            <div className="space-y-4">
              <FamilyMemberCard title="Ayah" required placeholder="Ayah" />
              <FamilyMemberCard title="Ibu" required placeholder="Ibu" />
              <MultiFamily title="Suami" addLabel="Tambah Suami" />
              <MultiFamily title="Istri" addLabel="Tambah Istri" />
              <MultiFamily title="Kakak" addLabel="Tambah Kakak" />
              <MultiFamily title="Adik" addLabel="Tambah Adik" />
            </div>
          </div>
        )}

        {activeStep === 6 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">INFORMASI JEPANG</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <YesNo placeholder="Pernah ke Jepang?" required />
              <YesNo placeholder="Punya Keluarga di Jepang?" required />
              <YesNo placeholder="Punya Kenalan di Jepang?" required />
            </div>
          </div>
        )}

        {activeStep === 7 && (
          <div>
            <h2 className="mb-4 text-sm font-bold text-slate-800">MOTIVASI, TUJUAN &amp; POIN PENDUKUNG</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tujuan ke Jepang" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Tuliskan tujuan Anda pergi ke Jepang..." /></Field>
              <Field label="Alasan Ingin ke Jepang" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Alasan Anda..." /></Field>
              <Field label="Cita-cita Setelah Pulang dari Jepang" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Cita-cita..." /></Field>
              <Field label="Rencana Pengiriman Uang/Bulan ke Indonesia (Rp)" required><input type="number" className={inputCls} placeholder="3000000" /></Field>
              <Field label="Kelebihan Diri" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Kelebihan Anda..." /></Field>
              <Field label="Kekurangan Diri" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Kekurangan Anda..." /></Field>
              <Field label="Hobi" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Hobi Anda..." /></Field>
              <Field label="Keahlian" required><textarea className={`${inputCls} min-h-[70px]`} placeholder="Keahlian Anda..." /></Field>
              <YesNo placeholder="Bersedia Kerja Shift?" required />
              <YesNo placeholder="Bersedia Lembur?" required />
              <YesNo placeholder="Bersedia Kerja Hari Libur?" required />
              <Field label="Lama Ingin Tinggal di Jepang" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>&lt; 1 tahun</option><option>1-3 tahun</option><option>3-5 tahun</option><option>&gt; 5 tahun</option></select>
              </Field>
              <Field label="Lama Ingin Bekerja di Perusahaan" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>&lt; 1 tahun</option><option>1-3 tahun</option><option>3-5 tahun</option><option>&gt; 5 tahun</option></select>
              </Field>
              <Field label="Rencana Pulang ke Indonesia (5 tahun)" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>1 tahun</option><option>2 tahun</option><option>3 tahun</option><option>4 tahun</option><option>5 tahun</option></select>
              </Field>
              <Field label="Sumber Biaya Keberangkatan" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Biaya sendiri</option><option>Pinjaman</option><option>Beasiswa</option><option>Lainnya</option></select>
              </Field>
              <Field label="Biaya yang Disiapkan" required>
                <select className={inputCls} defaultValue=""><option value="">Pilih...</option><option>Rp 5.000.000</option><option>Rp 10.000.000</option><option>Rp 15.000.000</option><option>&gt; Rp 15.000.000</option></select>
              </Field>
            </div>
          </div>
        )}

        {activeStep === 8 && (
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-800">UPLOAD DOKUMEN PENDUKUNG</h2>
            <div className="mb-5 rounded-lg bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
              <p className="mb-1 font-semibold">Batas ukuran file:</p>
              <p>• Semua dokumen: Maks 500KB</p>
              <p>• Foto Full Body: Maks 500KB</p>
              <p>• Video Perkenalan: Maks 500KB</p>
              <p className="mt-1">Format: JPG, PNG, PDF, MP4. Semua dokumen wajib diupload.</p>
            </div>
            <div className="space-y-3">
              <UploadRow label="Sertifikat JFT" note="Maks 500KB" />
              <UploadRow label="Pas Foto" required note="Maks 500KB" />
              <UploadRow label="Foto Full Body" required note="Maks 500KB" />
              <UploadRow label="Kartu Keluarga (KK)" required note="Maks 500KB" />
              <UploadRow label="KTP" required note="Maks 500KB" />
              <UploadRow label="Ijazah" required note="Maks 500KB" />
              <UploadRow label="Akte Kelahiran" required note="Maks 500KB" />
              <UploadRow label="Dokumen Lainnya" note="Maks 500KB" />
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Sertifikat SSW (Opsional)</p>
                <button
                  onClick={() => setSswCert(prev => [...prev, prev.length])}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Plus size={13} />
                  Tambah
                </button>
              </div>
              <div className="space-y-3">
                {sswCert.map(id => (
                  <div key={id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Sertifikat SSW #{id + 1}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-slate-400">Belum ada file</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSswCert(prev => prev.filter(x => x !== id))}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                          <Upload size={13} />
                          Pilih File
                          <input type="file" className="hidden" />
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

        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <button
            onClick={() => setActiveStep(s => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Sebelumnya
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => Swal.fire({ icon: 'info', title: 'Disimpan', text: 'Data berhasil disimpan (dummy).', confirmButtonColor: '#0E6187' })}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Save size={15} />
              Simpan
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0a4a6a]"
              >
                Lanjut
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={kirim}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Send size={15} />
                Kirim Formulir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
