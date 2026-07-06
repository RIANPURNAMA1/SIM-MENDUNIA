import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Upload, FileText, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { izinApi } from '../../services/api'

const jenisList = [
  { value: 'SAKIT', label: 'Sakit', desc: 'Izin karena sakit' },
  { value: 'CUTI', label: 'Cuti', desc: 'Cuti tahunan / libur' },
  { value: 'IZIN', label: 'Izin', desc: 'Keperluan pribadi / keluarga' },
]

export default function PengajuanIzin() {
  const navigate = useNavigate()
  const [jenis, setJenis] = useState('SAKIT')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [alasan, setAlasan] = useState('')
  const [lampiran, setLampiran] = useState<File | null>(null)
  const [lampiranName, setLampiranName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLampiran(file)
      setLampiranName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tglMulai || !tglSelesai || !alasan) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Semua field wajib diisi' })
      return
    }
    if (alasan.length < 10) {
      Swal.fire({ icon: 'warning', title: 'Alasan Terlalu Pendek', text: 'Berikan alasan minimal 10 karakter' })
      return
    }
    if (tglSelesai < tglMulai) {
      Swal.fire({ icon: 'warning', title: 'Tanggal Tidak Valid', text: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai' })
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('jenis_izin', jenis)
      fd.append('tgl_mulai', tglMulai)
      fd.append('tgl_selesai', tglSelesai)
      fd.append('alasan', alasan)
      if (lampiran) fd.append('lampiran', lampiran)

      await izinApi.store(fd)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengajuan izin berhasil dikirim', timer: 2000, showConfirmButton: false })
      navigate('/dashboard-karyawan')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mengajukan izin'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-8">
      {/* Top Bar */}
      <div className="bg-white px-4 py-4 border-b border-[#E5E7EF] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-[#14182B]">Pengajuan Izin</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Jenis Izin */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-4">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Jenis Izin</h2>
          <div className="space-y-2">
            {jenisList.map(j => (
              <label key={j.value} onClick={() => setJenis(j.value)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-colors cursor-pointer ${
                  jenis === j.value
                    ? 'border-[#0069b0] bg-[#0069b0]/[0.04]'
                    : 'border-[#E5E7EF] bg-white'
                }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  jenis === j.value ? 'border-[#0069b0]' : 'border-[#C5C8D4]'
                }`}>
                  {jenis === j.value && <div className="w-2 h-2 rounded-full bg-[#0069b0]" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#14182B]">{j.label}</span>
                  <p className="text-[11px] text-[#8B90A0] font-medium">{j.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Tanggal */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-4">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Tanggal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] mb-1 block">Tanggal Mulai</label>
              <input type="date" value={tglMulai} min={today} onChange={e => setTglMulai(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EF] text-sm font-medium text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] mb-1 block">Tanggal Selesai</label>
              <input type="date" value={tglSelesai} min={tglMulai || today} onChange={e => setTglSelesai(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EF] text-sm font-medium text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>
          </div>
        </section>

        {/* Alasan */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-4">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Alasan</h2>
          <textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={4} placeholder="Jelaskan alasan izin Anda..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EF] text-sm font-medium text-[#14182B] placeholder:text-[#C5C8D4] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0] resize-none" />
          <p className="text-[10px] text-[#8B90A0] mt-1 font-medium">{alasan.length}/10 karakter minimal</p>
        </section>

        {/* Lampiran */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-4">
          <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Lampiran (opsional)</h2>
          <label className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-dashed border-[#C5C8D4] cursor-pointer hover:border-[#0069b0] transition-colors">
            <Upload size={18} className="text-[#8B90A0]" />
            <span className="text-sm font-medium text-[#6B7280] flex-1 truncate">{lampiranName || 'Upload file (jpeg, png, pdf)'}</span>
            <input type="file" accept=".jpeg,.jpg,.png,.pdf" onChange={handleFile} className="hidden" />
          </label>
          {lampiran && (
            <button type="button" onClick={() => { setLampiran(null); setLampiranName('') }}
              className="text-[11px] text-red-500 font-semibold mt-1.5">Hapus lampiran</button>
          )}
        </section>

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#0069b0] text-white font-bold text-sm hover:bg-[#004d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><FileText size={16} /> Ajukan Izin</>
          )}
        </button>

        <div className="flex items-start gap-2 px-1 pb-4">
          <AlertCircle size={14} className="text-[#8B90A0] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#8B90A0] font-medium leading-relaxed">
            Pengajuan izin akan ditinjau oleh atasan. Status pengajuan dapat dilihat di halaman riwayat izin.
          </p>
        </div>
      </form>
    </div>
  )
}
