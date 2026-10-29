import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  Send,
  UserRound,
  Users,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { izinSenseiApi } from '../../services/api'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface KelasOption {
  id: number
  nama_kelas: string
  level: string | number
  batch: string | null
  label: string
  tanggal_mulai: string
  tanggal_selesai: string
  status: string
}

interface MetaData {
  user: { id: number; name: string }
  jenis_izin: string[]
  kelas: KelasOption[]
}

interface RiwayatItem {
  id: number
  jenis_izin: string
  tgl_mulai: string
  tgl_selesai: string
  alasan: string
  jadwal_terdampak: 'SEMUA' | 'TERTENTU'
  jadwal_tertentu: string[] | null
  mekanisme_pengganti: 'USUL' | 'ADMIN'
  nama_pengganti: string | null
  catatan_pengganti: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  catatan_admin: string | null
  created_at: string
  kelas?: {
    id: number
    nama_kelas: string
    level: string | number
    batch_relasi?: { id: number; nama_batch: string } | null
  } | null
  pengganti?: { id: number; name: string } | null
}

const jenisOptions = [
  { value: 'IZIN_PRIBADI', label: 'Izin pribadi', desc: 'Keperluan pribadi di luar jam mengajar' },
  { value: 'SAKIT', label: 'Sakit', desc: 'Kondisi kesehatan tidak memungkinkan mengajar' },
  { value: 'URUSAN_KELUARGA', label: 'Urusan keluarga', desc: 'Keperluan keluarga yang mendesak' },
  { value: 'DINAS_LEMBAGA', label: 'Dinas / kegiatan lembaga', desc: 'Tugas resmi dari lembaga' },
  { value: 'IZIN_MENDADAK', label: 'Izin mendadak', desc: 'Keadaan darurat yang tidak terduga' },
]

const jenisLabel: Record<string, string> = Object.fromEntries(
  jenisOptions.map(item => [item.value, item.label])
)

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
}

const todayString = () => new Date().toISOString().slice(0, 10)

const formatTanggal = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatTanggalPendek = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatPeriode = (mulai: string, selesai: string) => {
  if (mulai === selesai) return formatTanggalPendek(mulai)
  return `${formatTanggalPendek(mulai)} - ${formatTanggalPendek(selesai)}`
}

export default function IzinSensei() {
  const navigate = useNavigate()

  const [meta, setMeta] = useState<MetaData | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [jadwalDates, setJadwalDates] = useState<string[]>([])
  const [jadwalLoading, setJadwalLoading] = useState(false)
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [riwayatLoading, setRiwayatLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    jenis_izin: 'IZIN_PRIBADI',
    tgl_mulai: todayString(),
    tgl_selesai: todayString(),
    alasan: '',
    kelas_sensei_id: '',
    jadwal_terdampak: 'SEMUA' as 'SEMUA' | 'TERTENTU',
    jadwal_tertentu: [] as string[],
    mekanisme_pengganti: 'ADMIN' as 'USUL' | 'ADMIN',
    nama_pengganti: '',
    catatan_pengganti: '',
  })

  const selectedKelas = useMemo(
    () => meta?.kelas.find(item => String(item.id) === form.kelas_sensei_id) ?? null,
    [meta, form.kelas_sensei_id]
  )

  const targetDates = useMemo(
    () => (form.jadwal_terdampak === 'SEMUA' ? jadwalDates : form.jadwal_tertentu),
    [form.jadwal_terdampak, form.jadwal_tertentu, jadwalDates]
  )

  const loadMeta = useCallback(async () => {
    setMetaLoading(true)
    try {
      const res = await izinSenseiApi.meta()
      const data: MetaData = res.data
      setMeta(data)
      setForm(prev => ({
        ...prev,
        kelas_sensei_id: prev.kelas_sensei_id || (data.kelas[0] ? String(data.kelas[0].id) : ''),
      }))
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal memuat data sensei'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setMetaLoading(false)
    }
  }, [])

  const loadRiwayat = useCallback(async () => {
    setRiwayatLoading(true)
    try {
      const res = await izinSenseiApi.list({ my: true, per_page: 10 })
      setRiwayat(res.data?.data ?? [])
    } catch {
      setRiwayat([])
    } finally {
      setRiwayatLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeta()
    loadRiwayat()
  }, [loadMeta, loadRiwayat])

  useEffect(() => {
    if (
      !form.kelas_sensei_id ||
      !form.tgl_mulai ||
      !form.tgl_selesai ||
      form.tgl_selesai < form.tgl_mulai
    ) {
      setJadwalDates([])
      return
    }

    let aktif = true
    setJadwalLoading(true)

    izinSenseiApi
      .jadwal({
        kelas_sensei_id: Number(form.kelas_sensei_id),
        tgl_mulai: form.tgl_mulai,
        tgl_selesai: form.tgl_selesai,
      })
      .then(res => {
        if (!aktif) return
        const dates: string[] = res.data?.tanggal ?? []
        setJadwalDates(dates)
        setForm(prev => ({
          ...prev,
          jadwal_tertentu: dates.filter(date => prev.jadwal_tertentu.includes(date)).length > 0
            ? dates.filter(date => prev.jadwal_tertentu.includes(date))
            : dates,
        }))
      })
      .catch(() => {
        if (aktif) setJadwalDates([])
      })
      .finally(() => {
        if (aktif) setJadwalLoading(false)
      })

    return () => {
      aktif = false
    }
  }, [form.kelas_sensei_id, form.tgl_mulai, form.tgl_selesai])

  const toggleDate = (tanggal: string) => {
    setForm(prev => ({
      ...prev,
      jadwal_tertentu: prev.jadwal_tertentu.includes(tanggal)
        ? prev.jadwal_tertentu.filter(item => item !== tanggal)
        : [...prev.jadwal_tertentu, tanggal].sort(),
    }))
  }

  const toggleSemuaTanggal = () => {
    setForm(prev => ({
      ...prev,
      jadwal_tertentu:
        jadwalDates.length > 0 && jadwalDates.every(item => prev.jadwal_tertentu.includes(item))
          ? []
          : [...jadwalDates],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.kelas_sensei_id) {
      Swal.fire({ icon: 'warning', title: 'Kelas Belum Dipilih', text: 'Pilih kelas atau batch yang ditinggalkan.' })
      return
    }
    if (!form.tgl_mulai || !form.tgl_selesai) {
      Swal.fire({ icon: 'warning', title: 'Tanggal Belum Lengkap', text: 'Isi tanggal mulai dan tanggal selesai izin.' })
      return
    }
    if (form.tgl_selesai < form.tgl_mulai) {
      Swal.fire({ icon: 'warning', title: 'Tanggal Tidak Valid', text: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.' })
      return
    }
    if (form.alasan.trim().length < 10) {
      Swal.fire({ icon: 'warning', title: 'Alasan Terlalu Pendek', text: 'Berikan alasan izin minimal 10 karakter.' })
      return
    }
    if (jadwalDates.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Tidak Ada Jadwal', text: 'Tidak ada jadwal kelas pada rentang tanggal tersebut.' })
      return
    }
    if (form.jadwal_terdampak === 'TERTENTU' && form.jadwal_tertentu.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Jadwal Belum Dipilih', text: 'Pilih minimal satu jadwal yang terdampak.' })
      return
    }
    if (form.mekanisme_pengganti === 'USUL' && form.nama_pengganti.trim().length < 2) {
      Swal.fire({ icon: 'warning', title: 'Nama Pengganti Belum Diisi', text: 'Tulis nama sensei pengganti yang Anda usulkan.' })
      return
    }

    const konfirmasi = await Swal.fire({
      icon: 'question',
      title: 'Kirim Pengajuan Izin?',
      html: `
        <p class="text-sm text-gray-600 mb-2">Pengajuan izin mengajar akan dikirim ke admin / koordinator.</p>
        <p class="text-xs text-gray-500">${selectedKelas?.label ?? '-'} · ${formatPeriode(form.tgl_mulai, form.tgl_selesai)}</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0069b0',
      cancelButtonColor: '#9CA3AF',
    })

    if (!konfirmasi.isConfirmed) return

    setSubmitting(true)
    try {
      await izinSenseiApi.store({
        jenis_izin: form.jenis_izin,
        tgl_mulai: form.tgl_mulai,
        tgl_selesai: form.tgl_selesai,
        alasan: form.alasan.trim(),
        kelas_sensei_id: Number(form.kelas_sensei_id),
        jadwal_terdampak: form.jadwal_terdampak,
        jadwal_tertentu: targetDates,
        mekanisme_pengganti: form.mekanisme_pengganti,
        nama_pengganti: form.mekanisme_pengganti === 'USUL' ? form.nama_pengganti.trim() : null,
        catatan_pengganti: form.catatan_pengganti.trim() || null,
      })

      await Swal.fire({
        icon: 'success',
        title: 'Pengajuan Terkirim',
        text: 'Pengajuan izin sensei berhasil dikirim dan menunggu persetujuan.',
        confirmButtonColor: '#0069b0',
        confirmButtonText: 'Baik',
      })

      setForm(prev => ({
        ...prev,
        alasan: '',
        jadwal_terdampak: 'SEMUA',
        jadwal_tertentu: jadwalDates,
        mekanisme_pengganti: 'ADMIN',
        nama_pengganti: '',
        catatan_pengganti: '',
      }))
      loadRiwayat()
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengirim pengajuan izin'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const semuaTanggalTerpilih =
    jadwalDates.length > 0 && jadwalDates.every(item => form.jadwal_tertentu.includes(item))

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-28">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0a7ac6] to-[#0069b0]" />

      <div className="sticky top-0 z-20 border-b border-[#E5E7EF] bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-lg p-1 text-[#4B5063] transition-colors hover:bg-[#F4F5F8]"
            title="Kembali"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]">
            <FileText size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#14182B]">Izin Sensei</h1>
            <p className="text-[11px] font-medium text-[#8B90A0]">Pengajuan izin mengajar & pengganti sementara</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        <section className="rounded-xl border border-[#E5E7EF] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0069b0]/[0.08] text-xs font-bold text-[#0069b0]">1</span>
            <div>
              <h2 className="text-sm font-bold text-[#14182B]">Data Izin</h2>
              <p className="text-[11px] font-medium text-[#8B90A0]">Data pengajuan izin sensei</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Nama sensei</label>
              <div className="flex items-center gap-2.5 rounded-lg border border-[#E5E7EF] bg-[#FAFBFD] px-3 py-2.5">
                <UserRound size={16} className="text-[#8B90A0]" />
                <span className="text-sm font-semibold text-[#14182B]">
                  {metaLoading ? 'Memuat...' : meta?.user.name ?? '-'}
                </span>
                <span className="ml-auto text-[10px] font-medium text-[#8B90A0]">Otomatis dari akun login</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Jenis izin</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {jenisOptions.map(item => {
                  const aktif = form.jenis_izin === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, jenis_izin: item.value }))}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        aktif ? 'border-[#0069b0] bg-[#0069b0]/[0.04]' : 'border-[#E5E7EF] bg-white hover:border-[#B8C4D6]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                          aktif ? 'border-[#0069b0]' : 'border-[#C5C8D4]'
                        }`}
                      >
                        {aktif && <span className="h-2 w-2 rounded-full bg-[#0069b0]" />}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-[#14182B]">{item.label}</span>
                        <span className="block text-[10px] font-medium leading-snug text-[#8B90A0]">{item.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Tanggal mulai izin</label>
                <input
                  type="date"
                  value={form.tgl_mulai}
                  onChange={event => setForm(prev => ({ ...prev, tgl_mulai: event.target.value }))}
                  className="w-full rounded-lg border border-[#E5E7EF] px-3 py-2.5 text-sm font-medium text-[#14182B] outline-none transition focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Tanggal selesai izin</label>
                <input
                  type="date"
                  value={form.tgl_selesai}
                  min={form.tgl_mulai}
                  onChange={event => setForm(prev => ({ ...prev, tgl_selesai: event.target.value }))}
                  className="w-full rounded-lg border border-[#E5E7EF] px-3 py-2.5 text-sm font-medium text-[#14182B] outline-none transition focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Alasan izin</label>
              <textarea
                value={form.alasan}
                onChange={event => setForm(prev => ({ ...prev, alasan: event.target.value }))}
                rows={4}
                placeholder="Jelaskan alasan izin mengajar Anda..."
                className="w-full resize-none rounded-lg border border-[#E5E7EF] px-3 py-2.5 text-sm font-medium text-[#14182B] outline-none transition placeholder:text-[#C5C8D4] focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
              />
              <p className="mt-1 text-[10px] font-medium text-[#8B90A0]">
                {form.alasan.trim().length}/10 karakter minimal
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EF] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0069b0]/[0.08] text-xs font-bold text-[#0069b0]">2</span>
            <div>
              <h2 className="text-sm font-bold text-[#14182B]">Jadwal Kelas yang Ditinggalkan</h2>
              <p className="text-[11px] font-medium text-[#8B90A0]">Pilih kelas dan jadwal yang terdampak</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Kelas / batch</label>
              <select
                value={form.kelas_sensei_id}
                onChange={event => setForm(prev => ({ ...prev, kelas_sensei_id: event.target.value }))}
                className="w-full rounded-lg border border-[#E5E7EF] bg-white px-3 py-2.5 text-sm font-medium text-[#14182B] outline-none transition focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
              >
                <option value="">{metaLoading ? 'Memuat kelas...' : 'Pilih kelas / batch'}</option>
                {meta?.kelas.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {selectedKelas && (
                <p className="mt-1.5 text-[10px] font-medium text-[#8B90A0]">
                  Periode kelas: {formatPeriode(selectedKelas.tanggal_mulai, selectedKelas.tanggal_selesai)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Jadwal yang terdampak</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { value: 'SEMUA' as const, title: 'Semua jadwal pada tanggal tersebut', desc: 'Seluruh pertemuan dalam rentang izin' },
                  { value: 'TERTENTU' as const, title: 'Jadwal tertentu saja', desc: 'Pilih tanggal pertemuan tertentu' },
                ].map(item => {
                  const aktif = form.jadwal_terdampak === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, jadwal_terdampak: item.value }))}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        aktif ? 'border-[#0069b0] bg-[#0069b0]/[0.04]' : 'border-[#E5E7EF] bg-white hover:border-[#B8C4D6]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                          aktif ? 'border-[#0069b0]' : 'border-[#C5C8D4]'
                        }`}
                      >
                        {aktif && <span className="h-2 w-2 rounded-full bg-[#0069b0]" />}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-[#14182B]">{item.title}</span>
                        <span className="block text-[10px] font-medium leading-snug text-[#8B90A0]">{item.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E7EF] bg-[#FAFBFD] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-[#0069b0]" />
                  <p className="text-[11px] font-bold text-[#4B5063]">
                    Jadwal terdeteksi {jadwalDates.length > 0 ? `(${jadwalDates.length} pertemuan)` : ''}
                  </p>
                </div>
                {form.jadwal_terdampak === 'TERTENTU' && jadwalDates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSemuaTanggal}
                    className="text-[10px] font-bold text-[#0069b0] hover:text-[#004d7a]"
                  >
                    {semuaTanggalTerpilih ? 'Batal pilih semua' : 'Pilih semua'}
                  </button>
                )}
              </div>

              {jadwalLoading ? (
                <div className="flex items-center gap-2 py-2 text-[11px] font-medium text-[#8B90A0]">
                  <Loader2 size={14} className="animate-spin" /> Memeriksa jadwal kelas...
                </div>
              ) : jadwalDates.length === 0 ? (
                <p className="py-1 text-[11px] font-medium text-[#8B90A0]">
                  Tidak ada jadwal kelas pada rentang tanggal yang dipilih.
                </p>
              ) : form.jadwal_terdampak === 'SEMUA' ? (
                <div className="flex flex-wrap gap-1.5">
                  {jadwalDates.map(tanggal => (
                    <span key={tanggal} className="rounded-md border border-[#D7E4F3] bg-white px-2 py-1 text-[10px] font-semibold text-[#0069b0]">
                      {formatTanggalPendek(tanggal)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {jadwalDates.map(tanggal => {
                    const dipilih = form.jadwal_tertentu.includes(tanggal)
                    return (
                      <label
                        key={tanggal}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md border bg-white px-2.5 py-2 transition-colors ${
                          dipilih ? 'border-[#0069b0]/40' : 'border-[#E5E7EF]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={dipilih}
                          onChange={() => toggleDate(tanggal)}
                          className="h-3.5 w-3.5 accent-[#0069b0]"
                        />
                        <span className="text-[11px] font-semibold text-[#14182B]">{formatTanggal(tanggal)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EF] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0069b0]/[0.08] text-xs font-bold text-[#0069b0]">3</span>
            <div>
              <h2 className="text-sm font-bold text-[#14182B]">Pengganti Sementara</h2>
              <p className="text-[11px] font-medium text-[#8B90A0]">Tentukan mekanisme pengganti kelas</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Mekanisme pengganti</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { value: 'USUL' as const, title: 'Saya mengusulkan sensei pengganti', desc: 'Tulis nama sensei pengganti secara manual' },
                  { value: 'ADMIN' as const, title: 'Mohon dicarikan admin / koordinator', desc: 'Admin akan mencarikan pengganti' },
                ].map(item => {
                  const aktif = form.mekanisme_pengganti === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, mekanisme_pengganti: item.value }))}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        aktif ? 'border-[#0069b0] bg-[#0069b0]/[0.04]' : 'border-[#E5E7EF] bg-white hover:border-[#B8C4D6]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                          aktif ? 'border-[#0069b0]' : 'border-[#C5C8D4]'
                        }`}
                      >
                        {aktif && <span className="h-2 w-2 rounded-full bg-[#0069b0]" />}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-[#14182B]">{item.title}</span>
                        <span className="block text-[10px] font-medium leading-snug text-[#8B90A0]">{item.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {form.mekanisme_pengganti === 'USUL' ? (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">Nama sensei pengganti</label>
                  <div className="relative">
                    <Users size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B90A0]" />
                    <input
                      type="text"
                      value={form.nama_pengganti}
                      onChange={event => setForm(prev => ({ ...prev, nama_pengganti: event.target.value }))}
                      placeholder="Tulis nama lengkap pengganti (ex: Alumni Mendunia / Nama lengkap)"
                      maxLength={255}
                      className="w-full rounded-lg border border-[#E5E7EF] bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-[#14182B] outline-none transition placeholder:text-[#C5C8D4] focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
                    />
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[10px] font-medium text-[#8B90A0]">
                    <AlertCircle size={12} className="mt-0.5 flex-none" />
                    Wajib isi identitas pengganti secara jelas (Nama lengkap + keterangan asal, mis. Alumni Mendunia / tenaga pengganti). Admin/koordinator akan memverifikasi jadwalnya.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280]">
                    Catatan untuk pengganti <span className="font-medium text-[#8B90A0]">(opsional)</span>
                  </label>
                  <textarea
                    value={form.catatan_pengganti}
                    onChange={event => setForm(prev => ({ ...prev, catatan_pengganti: event.target.value }))}
                    rows={3}
                    placeholder="Contoh: lanjutkan pertemuan ke-5, materi ada di LMS..."
                    className="w-full resize-none rounded-lg border border-[#E5E7EF] px-3 py-2.5 text-sm font-medium text-[#14182B] outline-none transition placeholder:text-[#C5C8D4] focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/20"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#D7E4F3] bg-[#F5F9FE] px-3 py-3">
                <Users size={16} className="mt-0.5 flex-none text-[#0069b0]" />
                <div>
                  <p className="text-xs font-bold text-[#14182B]">Admin / koordinator akan mencarikan pengganti</p>
                  <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-[#8B90A0]">
                    Pengajuan tetap dikirim dan admin akan memeriksa ketersediaan sensei lain untuk jadwal yang ditinggalkan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || metaLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0069b0] py-3 text-sm font-bold text-white transition-colors hover:bg-[#004d7a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
          {submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Izin'}
        </button>

        <div className="flex items-start gap-2 px-1 pb-2">
          <AlertCircle size={14} className="mt-0.5 flex-none text-[#8B90A0]" />
          <p className="text-[10px] font-medium leading-relaxed text-[#8B90A0]">
            Pengajuan akan ditinjau oleh admin / koordinator. Status pengajuan dapat dilihat pada riwayat di bawah.
          </p>
        </div>
      </form>

      <section className="mx-auto mt-4 max-w-3xl px-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#14182B]">Riwayat Pengajuan Izin</h2>
            <p className="text-[11px] font-medium text-[#8B90A0]">10 pengajuan terakhir</p>
          </div>
          <button
            type="button"
            onClick={loadRiwayat}
            className="text-[11px] font-bold text-[#0069b0] hover:text-[#004d7a]"
          >
            Muat ulang
          </button>
        </div>

        {riwayatLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl border border-[#E5E7EF] bg-white" />
            ))}
          </div>
        ) : riwayat.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EF] bg-white px-4 py-10 text-center">
            <Clock size={24} className="mx-auto text-[#C5C8D4]" />
            <p className="mt-2 text-xs font-semibold text-[#4B5063]">Belum ada pengajuan izin</p>
            <p className="mt-0.5 text-[10px] font-medium text-[#8B90A0]">Pengajuan yang Anda kirim akan tampil di sini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {riwayat.map(item => (
              <div key={item.id} className="rounded-xl border border-[#E5E7EF] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#14182B]">{jenisLabel[item.jenis_izin] || item.jenis_izin}</span>
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold ${statusStyle[item.status] || 'border-gray-200 bg-gray-100 text-gray-500'}`}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-[#4B5063]">
                      {formatPeriode(item.tgl_mulai, item.tgl_selesai)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[#8B90A0]">
                      {item.kelas
                        ? `${item.kelas.batch_relasi?.nama_batch || item.kelas.nama_kelas} · Level ${item.kelas.level}`
                        : 'Kelas tidak tercatat'}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-[9px] font-medium text-[#8B90A0]">Diajukan</p>
                    <p className="text-[10px] font-semibold text-[#4B5063]">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-[#F4F5F8] px-2 py-1 text-[9px] font-semibold text-[#6B7280]">
                    {item.jadwal_terdampak === 'SEMUA' ? 'Semua jadwal' : `${item.jadwal_tertentu?.length ?? 0} jadwal tertentu`}
                  </span>
                  <span className="rounded-md bg-[#F4F5F8] px-2 py-1 text-[9px] font-semibold text-[#6B7280]">
                    {item.mekanisme_pengganti === 'USUL'
                      ? item.nama_pengganti ? `Pengganti: ${item.nama_pengganti}` : 'Usul pengganti'
                      : 'Dicarikan admin'}
                  </span>
                </div>

                {item.alasan && (
                  <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-relaxed text-[#8B90A0]">{item.alasan}</p>
                )}
                {item.catatan_admin && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-[#FFF7ED] px-2.5 py-1.5 text-[10px] font-medium text-amber-700">
                    <AlertCircle size={12} className="mt-0.5 flex-none" />
                    Catatan admin: {item.catatan_admin}
                  </div>
                )}
                {item.status === 'APPROVED' && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                    <CheckCircle2 size={12} /> Pengajuan disetujui
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <KaryawanBottomNav
        activeTab="home"
        absenStatus="belum"
        hasJadwal={false}
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/izin-sensei"
        profilHref="/guru-profil"
      />

    </div>
  )
}
