import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, CalendarDays, Camera, Check, CheckCircle2, Circle, FileText,
  Image as ImageIcon, ListChecks, MapPin, Save, Trash2, Users, X, Activity,
} from 'lucide-react'
import { pertemuanApi } from '../../services/api'
import Swal from 'sweetalert2'

interface PaketOption {
  id: number
  title: string
  category: string | null
  label: string
}

interface PaketRef {
  id: number
  title: string
  category?: string | null
}

interface PertemuanData {
  id: number
  pertemuan_ke: number
  tanggal: string
  materi: string | null
  foto_bukti: string | null
  foto_bukti_path: string | null
  latihan_paket_id: number | null
  latihan_paket: PaketRef | null
  ulangan_harian_paket_id: number | null
  ulangan_harian_paket: PaketRef | null
  ulangan_mingguan_paket_id: number | null
  ulangan_mingguan_paket: PaketRef | null
}

interface PertemuanItem {
  pertemuan_ke: number
  tanggal: string
  tanggal_label: string
  data: PertemuanData | null
}

interface KelasInfo {
  id: number
  nama_kelas: string
  sensei: string | null
  batch: string | null
  cabang: string | null
  level: number | string
  tanggal_mulai: string
  tanggal_selesai: string
  status: string
  total_pertemuan: number
}

interface Props {
  readOnly?: boolean
  backPath?: string
}

export default function GuruPertemuanDetail({ readOnly = false, backPath = '/guru-pertemuan' }: Props) {
  const { kelasId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [kelas, setKelas] = useState<KelasInfo | null>(null)
  const [pertemuan, setPertemuan] = useState<PertemuanItem[]>([])
  const [paketOptions, setPaketOptions] = useState<PaketOption[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [terisi, setTerisi] = useState(0)

  const [modalDate, setModalDate] = useState<string | null>(null)
  const [form, setForm] = useState({ materi: '', latihan_paket_id: '', ulangan_harian_paket_id: '', ulangan_mingguan_paket_id: '' })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [hapusFoto, setHapusFoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!kelasId) return
    setLoading(true)
    try {
      const res = await pertemuanApi.detail(kelasId)
      const d = res.data
      setKelas(d.kelas)
      setPertemuan(d.pertemuan || [])
      setPaketOptions(d.paket_options || [])
      setCanEdit(!!d.can_edit && !readOnly)
      setTerisi(d.terisi || 0)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memuat riwayat pertemuan' })
    } finally {
      setLoading(false)
    }
  }, [kelasId, readOnly])

  useEffect(() => { load() }, [load])

  const openModal = (item: PertemuanItem) => {
    const d = item.data
    setModalDate(item.tanggal)
    setForm({
      materi: d?.materi || '',
      latihan_paket_id: d?.latihan_paket_id ? String(d.latihan_paket_id) : '',
      ulangan_harian_paket_id: d?.ulangan_harian_paket_id ? String(d.ulangan_harian_paket_id) : '',
      ulangan_mingguan_paket_id: d?.ulangan_mingguan_paket_id ? String(d.ulangan_mingguan_paket_id) : '',
    })
    setFotoFile(null)
    setFotoPreview(d?.foto_bukti || null)
    setHapusFoto(false)
  }

  const onFotoChange = (file: File | null) => {
    setFotoFile(file)
    setHapusFoto(false)
    if (file) {
      const reader = new FileReader()
      reader.onload = e => setFotoPreview(String(e.target?.result))
      reader.readAsDataURL(file)
    } else {
      const d = pertemuan.find(p => p.tanggal === modalDate)?.data
      setFotoPreview(d?.foto_bukti || null)
    }
  }

  const simpan = async () => {
    if (!modalDate) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('tanggal', modalDate)
      fd.append('materi', form.materi)
      fd.append('hapus_foto', hapusFoto ? '1' : '0')
      if (fotoFile) fd.append('foto', fotoFile)
      fd.append('latihan_paket_id', form.latihan_paket_id)
      fd.append('ulangan_harian_paket_id', form.ulangan_harian_paket_id)
      fd.append('ulangan_mingguan_paket_id', form.ulangan_mingguan_paket_id)

      await pertemuanApi.store(kelasId!, fd)
      setModalDate(null)
      await load()
      Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Riwayat pertemuan berhasil disimpan', timer: 1500, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menyimpan riwayat pertemuan'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const modalItem = modalDate ? pertemuan.find(p => p.tanggal === modalDate) : null
  const persen = kelas && kelas.total_pertemuan > 0 ? Math.round((terisi / kelas.total_pertemuan) * 100) : 0

  const syncNilai = async () => {
    if (!kelasId) return
    const conf = await Swal.fire({
      title: 'Tarik nilai quiz ke Penilaian Siswa?',
      text: 'Nilai terbaik siswa dari paket Ulangan Harian/Mingguan di kelas ini akan ditulis ke komponen "Ulangan" pada tanggal pertemuan bersangkutan. Nilai manual yang sudah terisi akan tertimpa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, sinkronkan',
      cancelButtonText: 'Batal',
    })
    if (!conf.isConfirmed) return
    setSyncing(true)
    try {
      const res = await pertemuanApi.syncNilai(Number(kelasId))
      Swal.fire({ icon: 'success', title: 'Selesai', text: res.data.message, timer: 2500, showConfirmButton: false })
      await load()
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Gagal sinkronisasi', text: e?.response?.data?.message || 'Terjadi kesalahan' })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <BookOpen size={22} className="text-[#0E6187]" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <button onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#0E6187] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Kelas info */}
      {kelas && (
        <div className="bg-gradient-to-br from-[#0E6187] to-[#0f2840] rounded-xl shadow-lg shadow-[#0E6187]/20 p-5 mb-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{kelas.batch || 'Kelas'} · Sensei: {kelas.sensei || '-'}</p>
              <h1 className="text-lg font-black mt-0.5">Riwayat Pertemuan — Level {kelas.level}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-white/70">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {kelas.tanggal_mulai} – {kelas.tanggal_selesai}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {kelas.cabang || '-'}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {kelas.total_pertemuan} pertemuan</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-black ${persen >= 100 ? 'text-emerald-300' : 'text-white'}`}>{persen}%</p>
              <p className="text-[10px] text-white/60">{terisi} dari {kelas.total_pertemuan} pertemuan terisi</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/15 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${persen >= 100 ? 'bg-emerald-300' : 'bg-white'}`} style={{ width: `${persen}%` }} />
          </div>
          {readOnly && (
            <p className="mt-2 text-[10px] text-white/50 italic">Mode lihat — riwayat hanya dapat diubah oleh sensei pemilik kelas.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <ListChecks size={15} className="text-[#0E6187]" /> Daftar Riwayat Pertemuan
        </h2>
        {canEdit && (
          <button onClick={syncNilai} disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-[#0E6187] px-3 py-2 text-[11px] font-bold text-white shadow transition hover:bg-[#0c4f70] disabled:opacity-50">
            <Activity size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Menyinkronkan…' : 'Tarik Nilai Quiz → Penilaian'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {pertemuan.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Tidak ada pertemuan (pastikan tanggal mulai–selesai kelas sudah diatur).</p>
          </div>
        )}

        {pertemuan.map(item => {
          const d = item.data
          const filled = !!d
          return (
            <div key={item.tanggal} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${filled ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  {filled
                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                    : <Circle size={18} className="text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-800">Pertemuan {item.pertemuan_ke} <span className="text-[10px] font-bold text-slate-400">· {item.tanggal_label}</span></p>
                  <p className={`text-[10px] font-bold ${filled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {filled ? 'Riwayat terisi' : 'Belum diisi'}
                  </p>
                </div>
                {canEdit && (
                  <button onClick={() => openModal(item)}
                    className={`shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors ${
                      filled ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#0E6187] text-white hover:bg-[#0E6187]/90'
                    }`}>
                    {filled ? 'Edit' : 'Isi'}
                  </button>
                )}
              </div>

              {d && (
                <div className="px-4 pb-3 space-y-2">
                  {d.materi && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><FileText size={10} /> Materi</p>
                      <p className="text-[11px] text-slate-600 whitespace-pre-line">{d.materi}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {d.foto_bukti && (
                      <a href={d.foto_bukti} target="_blank" rel="noopener noreferrer"
                        className="relative w-20 h-20 rounded-lg overflow-hidden group inline-block">
                        <img src={d.foto_bukti} alt="Bukti pertemuan" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon size={16} className="text-white" />
                        </span>
                      </a>
                    )}
                    {d.latihan_paket && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[#0E6187]/10 text-[#0E6187]">
                        <BookOpen size={11} /> Latihan: {d.latihan_paket.title}
                        <button onClick={() => navigate(`/guru-paket-soal/monitor/${d.latihan_paket!.id}`, { state: { title: d.latihan_paket!.title } })}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-[#0E6187]/10 hover:bg-[#0E6187]/20 transition-colors" title="Monitor langsung">
                          <Activity size={9} />
                        </button>
                      </span>
                    )}
                    {d.ulangan_harian_paket && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <ListChecks size={11} /> Ulangan Harian: {d.ulangan_harian_paket.title}
                        <button onClick={() => navigate(`/guru-paket-soal/monitor/${d.ulangan_harian_paket!.id}`, { state: { title: d.ulangan_harian_paket!.title } })}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 transition-colors" title="Monitor langsung">
                          <Activity size={9} />
                        </button>
                      </span>
                    )}
                    {d.ulangan_mingguan_paket && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-600">
                        <Check size={11} /> Ulangan Mingguan: {d.ulangan_mingguan_paket.title}
                        <button onClick={() => navigate(`/guru-paket-soal/monitor/${d.ulangan_mingguan_paket!.id}`, { state: { title: d.ulangan_mingguan_paket!.title } })}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-violet-100 hover:bg-violet-200 transition-colors" title="Monitor langsung">
                          <Activity size={9} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modalDate && modalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pertemuan {modalItem.pertemuan_ke}</p>
                <h3 className="text-sm font-black text-slate-800">{modalItem.tanggal_label}</h3>
              </div>
              <button onClick={() => setModalDate(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Materi Pelajaran</label>
                <textarea
                  value={form.materi}
                  onChange={e => setForm({ ...form, materi: e.target.value })}
                  rows={4}
                  placeholder="Tulis ringkasan / materi yang diajarkan pada pertemuan ini..."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3.5 py-3 focus:outline-none focus:border-[#0E6187] focus:ring-2 focus:ring-[#0E6187]/10 resize-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bukti Pelajaran (Foto)</label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center gap-1 px-4 py-4 border-2 border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 hover:border-[#0E6187]/30 hover:bg-slate-50 cursor-pointer transition-all flex-1">
                    <Camera size={18} className="text-slate-300" />
                    {fotoFile ? fotoFile.name : 'Pilih / ganti foto bukti'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => onFotoChange(e.target.files?.[0] || null)} />
                  </label>
                  {fotoPreview && (
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden group">
                      <img src={fotoPreview} alt="Bukti" className="w-full h-full object-cover" />
                      {hapusFoto && (
                        <span className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                          <Trash2 size={16} className="text-white" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {(fotoPreview && !hapusFoto && !fotoFile) && (
                  <button onClick={() => setHapusFoto(true)}
                    className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-600">
                    Hapus foto bukti yang ada
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Latihan Soal</label>
                <select value={form.latihan_paket_id} onChange={e => setForm({ ...form, latihan_paket_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#0E6187] bg-white">
                  <option value="">Tidak ada latihan</option>
                  {paketOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ulangan Harian</label>
                <select value={form.ulangan_harian_paket_id} onChange={e => setForm({ ...form, ulangan_harian_paket_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#0E6187] bg-white">
                  <option value="">Tidak ada ulangan harian</option>
                  {paketOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ulangan Mingguan</label>
                <select value={form.ulangan_mingguan_paket_id} onChange={e => setForm({ ...form, ulangan_mingguan_paket_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#0E6187] bg-white">
                  <option value="">Tidak ada ulangan mingguan</option>
                  {paketOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setModalDate(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button onClick={simpan} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-white bg-[#0E6187] hover:bg-[#0E6187]/90 disabled:opacity-60 transition-colors">
                  <Save size={13} /> {saving ? 'Menyimpan...' : 'Simpan Riwayat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}