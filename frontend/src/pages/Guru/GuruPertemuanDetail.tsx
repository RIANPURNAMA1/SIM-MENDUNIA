import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, CalendarDays, Camera, Check, CheckCircle2, ChevronRight, Circle, FileText,
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

interface QuizSection {
  paket_id: number | null
  title: string | null
  category: string | null
  ada: boolean
  count: number
  rata_rata: number | null
  attempts: {
    siswa_id: number
    nama: string
    score: number | null
    correct_count: number
    total_count: number
    submitted_at: string | null
  }[]
}

interface KehadiranRow {
  siswa_id: number
  nama: string
  no_registrasi: string | null
  jam_masuk: string | null
  jam_keluar: string | null
  status: string | null
  keterangan: string | null
}

interface PenilaianRow {
  id: number
  komponen: string | null
  siswa_id: number
  nama: string | null
  nilai: number | null
  sumber: string | null
}

interface DetailPertemuan {
  kelas: { id: number; nama_kelas: string; batch: string | null; level: number | string; sensei: string | null }
  tanggal: string
  pertemuan_ke: number | null
  tanggal_label: string
  data: PertemuanData | null
  kehadiran: KehadiranRow[]
  ringkasan_kehadiran: Record<string, number>
  quiz: { latihan: QuizSection; ulangan_harian: QuizSection; ulangan_mingguan: QuizSection }
  penilaian: PenilaianRow[]
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

  const [detail, setDetail] = useState<DetailPertemuan | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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

  const bukaDetail = async (item: PertemuanItem) => {
    if (!kelasId) return
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await pertemuanApi.detailTanggal(Number(kelasId), item.tanggal)
      setDetail(res.data)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memuat detail pertemuan' })
    } finally {
      setDetailLoading(false)
    }
  }

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

  const penilaianByKomponen = (detail?.penilaian || []).reduce<Record<string, PenilaianRow[]>>((acc, r) => {
    const k = r.komponen || 'Lainnya'
    ;(acc[k] = acc[k] || []).push(r)
    return acc
  }, {})

  const kehadiranBadge = (st?: string | null) => {
    const s = (st || '').toUpperCase()
    const map: Record<string, string> = {
      HADIR: 'bg-emerald-50 text-emerald-600',
      TERLAMBAT: 'bg-amber-50 text-amber-600',
      IZIN: 'bg-sky-50 text-sky-600',
      SAKIT: 'bg-rose-50 text-rose-600',
      ALPA: 'bg-slate-100 text-slate-500',
    }
    return map[s] || 'bg-slate-100 text-slate-500'
  }

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
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-[#0E6187]" />
                </span>
                Riwayat Pertemuan — Level {kelas.level}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 ml-11">
                {kelas.batch || 'Kelas'} · Sensei: {kelas.sensei || '-'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-lg font-black ${persen >= 100 ? 'text-emerald-500' : 'text-[#0E6187]'}`}>{persen}%</p>
              <p className="text-[10px] font-bold text-slate-400">{terisi} dari {kelas.total_pertemuan} pertemuan terisi</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><CalendarDays size={11} className="text-slate-400" /> {kelas.tanggal_mulai} – {kelas.tanggal_selesai}</span>
            <span className="flex items-center gap-1.5"><MapPin size={11} className="text-slate-400" /> {kelas.cabang || '-'}</span>
            <span className="flex items-center gap-1.5"><Users size={11} className="text-slate-400" /> {kelas.total_pertemuan} pertemuan</span>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-all duration-500 ${persen >= 100 ? 'bg-emerald-400' : 'bg-[#0E6187]'}`} style={{ width: `${persen}%` }} />
          </div>
          {readOnly && (
            <p className="text-[10px] text-slate-400 italic mb-5">Mode lihat — riwayat hanya dapat diubah oleh sensei pemilik kelas.</p>
          )}
        </>
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
<div key={item.tanggal} onClick={() => bukaDetail(item)}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer transition-all hover:border-[#0E6187]/40 hover:shadow-md group">
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
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-[#0E6187] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Lihat isi <ChevronRight size={12} />
            </span>
            {canEdit && (
              <button onClick={(e) => { e.stopPropagation(); openModal(item) }}
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
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/guru-paket-soal/monitor/${d.latihan_paket!.id}`, { state: { title: d.latihan_paket!.title } }) }}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-[#0E6187]/10 hover:bg-[#0E6187]/20 transition-colors" title="Monitor langsung">
                          <Activity size={9} />
                        </button>
                      </span>
                    )}
                    {d.ulangan_harian_paket && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <ListChecks size={11} /> Ulangan Harian: {d.ulangan_harian_paket.title}
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/guru-paket-soal/monitor/${d.ulangan_harian_paket!.id}`, { state: { title: d.ulangan_harian_paket!.title } }) }}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 transition-colors" title="Monitor langsung">
                          <Activity size={9} />
                        </button>
                      </span>
                    )}
                    {d.ulangan_mingguan_paket && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-600">
                        <Check size={11} /> Ulangan Mingguan: {d.ulangan_mingguan_paket.title}
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/guru-paket-soal/monitor/${d.ulangan_mingguan_paket!.id}`, { state: { title: d.ulangan_mingguan_paket!.title } }) }}
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
    {/* Detail pertemuan */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0E6187] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Memuat detail pertemuan...</p>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pertemuan {detail.pertemuan_ke ?? '-'} · {detail.kelas.nama_kelas}</p>
                <h3 className="text-sm font-black text-slate-800 truncate">{detail.tanggal_label}</h3>
                <p className="text-[10px] font-bold text-slate-400">
                  {detail.kelas.batch ? `Batch ${detail.kelas.batch} · ` : ''}Level {detail.kelas.level}
                </p>
              </div>
              <button onClick={() => setDetail(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Riwayat yang diisi sensei */}
              {detail.data ? (
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 mb-2">
                    <FileText size={13} className="text-[#0E6187]" /> Riwayat yang diisi sensei
                  </p>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {detail.data.materi && (
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">Materi Pembelajaran</p>
                        <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap">{detail.data.materi}</p>
                      </div>
                    )}
                    {detail.data.foto_bukti_path && (
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-slate-400 mb-2">Foto Bukti</p>
                        <img src={detail.data.foto_bukti_path} alt="Foto bukti"
                          className="w-48 rounded-lg border border-slate-200 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}
                    <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
                      {detail.data.latihan_paket && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-[10px] font-black text-teal-700">
                          <ListChecks size={11} /> Latihan: {detail.data.latihan_paket.title}
                        </span>
                      )}
                      {detail.data.ulangan_harian_paket && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[10px] font-black text-blue-700">
                          <ListChecks size={11} /> Ulangan Harian: {detail.data.ulangan_harian_paket.title}
                        </span>
                      )}
                      {detail.data.ulangan_mingguan_paket && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-[10px] font-black text-violet-700">
                          <ListChecks size={11} /> Ulangan Mingguan: {detail.data.ulangan_mingguan_paket.title}
                        </span>
                      )}
                      {!detail.data.latihan_paket && !detail.data.ulangan_harian_paket && !detail.data.ulangan_mingguan_paket && (
                        <p className="text-[10px] font-bold text-slate-400">Tidak ada soal quiz/tugas dipertemuan ini.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3">
                  <p className="text-[11px] font-bold text-slate-400">Sensei belum mengisi materi/quiz untuk pertemuan ini.</p>
                </div>
              )}

              {/* Quiz / tugas + hasil */}
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 mb-2">
                  <ListChecks size={13} className="text-[#0E6187]" /> Tugas & Quiz
                </p>
                <div className="grid gap-3">
                  {[
                    { key: 'latihan' as const, label: 'Latihan', box: 'bg-teal-50 text-teal-700' },
                    { key: 'ulangan_harian' as const, label: 'Ulangan Harian', box: 'bg-blue-50 text-blue-700' },
                    { key: 'ulangan_mingguan' as const, label: 'Ulangan Mingguan', box: 'bg-violet-50 text-violet-700' },
                  ].map(cfg => {
                    const s: QuizSection = detail.quiz[cfg.key]
                    if (!s.ada) return null
                    return (
                      <div key={cfg.key} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${cfg.box}`}>{cfg.label}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.count} siswa mengerjakan</span>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Rata-rata {s.rata_rata ?? '-'}</span>
                          </div>
                        </div>
                        {s.title && <p className="text-xs font-bold text-slate-700 mt-2">{s.title}</p>}
                        {s.attempts.length > 0 ? (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-[10px] font-black text-slate-400 border-b border-slate-100">
                                  <th className="py-1.5 pr-2">Siswa</th>
                                  <th className="py-1.5 pr-2 text-center">Benar</th>
                                  <th className="py-1.5 pr-2 text-center">Skor</th>
                                  <th className="py-1.5">Dikirim</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.attempts.map(a => (
                                  <tr key={a.siswa_id} className="border-b border-slate-50 last:border-0">
                                    <td className="py-1.5 pr-2 text-[11px] font-semibold text-slate-700">{a.nama}</td>
                                    <td className="py-1.5 pr-2 text-center text-[11px] font-bold text-slate-500">{a.correct_count ?? '-'} / {a.total_count ?? '-'}</td>
                                    <td className="py-1.5 pr-2 text-center text-[11px] font-black text-emerald-600">{a.score ?? '-'}</td>
                                    <td className="py-1.5 text-[11px] font-semibold text-slate-400">{a.submitted_at ?? '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-slate-400 mt-2">Belum ada siswa yang mengerjakan.</p>
                        )}
                      </div>
                    )
                  })}
                  {!detail.quiz.latihan.ada && !detail.quiz.ulangan_harian.ada && !detail.quiz.ulangan_mingguan.ada && (
                    <p className="text-[10px] font-bold text-slate-400">Tidak ada soal/tugas di pertemuan ini.</p>
                  )}
                </div>
              </div>

              {/* Kehadiran kandidat */}
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 mb-2">
                  <Users size={13} className="text-[#0E6187]" /> Kehadiran Kandidat
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'].map(k => (
                    <span key={k} className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {k.toLowerCase()}: {detail.ringkasan_kehadiran[k] || 0}
                    </span>
                  ))}
                  <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                    belum absen: {Math.max(0, (detail.ringkasan_kehadiran['total_siswa'] || 0) - (detail.ringkasan_kehadiran['terisi'] || 0))}
                  </span>
                </div>
                {detail.kehadiran.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 bg-slate-50 border-b border-slate-100">
                          <th className="py-2 px-3">Siswa</th>
                          <th className="py-2 px-3 text-center">Masuk</th>
                          <th className="py-2 px-3 text-center">Pulang</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.kehadiran.map(k => (
                          <tr key={k.siswa_id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 px-3 text-[11px] font-semibold text-slate-700">
                              {k.nama}
                              {k.no_registrasi && <span className="block text-[9px] font-bold text-slate-300">{k.no_registrasi}</span>}
                            </td>
                            <td className="py-2 px-3 text-center text-[11px] font-bold text-slate-500">{k.jam_masuk ? String(k.jam_masuk).slice(0, 5) : '-'}</td>
                            <td className="py-2 px-3 text-center text-[11px] font-bold text-slate-500">{k.jam_keluar ? String(k.jam_keluar).slice(0, 5) : '-'}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black ${kehadiranBadge(k.status)}`}>{k.status || '-'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400">Belum ada data kehadiran pada pertemuan ini.</p>
                )}
              </div>

              {/* Penilaian */}
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 mb-2">
                  <BookOpen size={13} className="text-[#0E6187]" /> Penilaian
                </p>
                {Object.keys(penilaianByKomponen).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(penilaianByKomponen).map(([komponen, rows]) => (
                      <div key={komponen} className="rounded-xl border border-slate-200 overflow-hidden">
                        <p className="px-3 py-2 text-[10px] font-black text-slate-500 bg-slate-50 border-b border-slate-100">{komponen}</p>
                        <table className="w-full">
                          <tbody>
                            {rows.map(r => (
                              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                                <td className="py-2 px-3 text-[11px] font-semibold text-slate-700">{r.nama}</td>
                                <td className="py-2 px-3 text-right text-[11px] font-black text-emerald-600">{r.nilai ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400">Belum ada penilaian pada pertemuan ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}