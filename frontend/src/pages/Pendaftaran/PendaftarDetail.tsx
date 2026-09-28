import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle, AlertTriangle, Trash2, Phone, Mail, MapPin,
  CalendarDays, Layers, Percent, Wallet, Receipt, Clock, BadgeCheck, Ban,
  RefreshCw, Landmark, ChevronRight, Loader2, CreditCard, UserRound, Check, Info,
} from 'lucide-react'
import api, { pendaftarApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

function fmt(n: number) {
  return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const rp = (n: number) => (Number(n) > 0 ? `Rp ${fmt(Number(n))}` : '-')

function tgl(value?: string | null, withTime = false) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
}

const statusBadge = (s?: string | null) => {
  const map: Record<string, string> = {
    pending: 'Pending', disetujui: 'Disetujui', ditolak: 'Ditolak',
    unpaid: 'Belum Bayar', processing: 'Proses', verified: 'Terverifikasi',
    ditangguhkan: 'Ditangguhkan',
  }
  return (s && map[s]) || s || '-'
}

const statusChip = (s?: string | null) => {
  switch (s) {
    case 'disetujui':
    case 'verified':
      return 'bg-emerald-600 text-white'
    case 'processing':
      return 'bg-blue-600 text-white'
    case 'pending':
    case 'unpaid':
      return 'bg-amber-500 text-white'
    case 'ditolak':
      return 'bg-red-600 text-white'
    case 'ditangguhkan':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-slate-500 text-white'
  }
}

const PAYMENT_STEPS = [
  { key: 'unpaid', label: 'Menunggu Bayar' },
  { key: 'processing', label: 'Dikonfirmasi' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'verified', label: 'Selesai' },
]

function stepIndex(pendaftar: any) {
  const bayar = pendaftar?.status_pembayaran
  const daftar = pendaftar?.status_pendaftaran
  if (bayar === 'verified') return 3
  if (bayar === 'processing') return daftar === 'disetujui' ? 2 : 1
  if (daftar === 'disetujui' && bayar === 'unpaid') return 0
  return 0
}

function inisial(nama?: string | null) {
  const parts = (nama || '?').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const STATUS_ACTIONS: Record<string, { status_pembayaran: string; status_pendaftaran: string; icon: any; chip: string }> = {
  waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending', icon: Clock, chip: 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700' },
  confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending', icon: BadgeCheck, chip: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700' },
  proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui', icon: RefreshCw, chip: 'hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700' },
  selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui', icon: CheckCircle, chip: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700' },
  ditangguhkan: { status_pembayaran: 'ditangguhkan', status_pendaftaran: 'pending', icon: Landmark, chip: 'hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700' },
  batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak', icon: Ban, chip: 'hover:border-red-400 hover:bg-red-50 hover:text-red-700' },
}

const STATUS_ACTIONS_LABEL: Record<string, string> = {
  waiting_payment: 'Menunggu Pembayaran',
  confirmed: 'Pembayaran Dikonfirmasi',
  proses: 'Mulai Proses',
  selesai: 'Selesaikan',
  ditangguhkan: 'Tangguhkan',
  batal: 'Batalkan',
}

const CONFIRM_MSG: Record<string, { icon: any; title: string; text: string; confirmText: string }> = {
  waiting_payment: { icon: 'question', title: 'Atur ke Menunggu Pembayaran?', text: 'Status pendaftaran kembali menjadi pending dan pembayaran menjadi belum bayar.', confirmText: 'Ya, Atur' },
  confirmed: { icon: 'question', title: 'Konfirmasi Pembayaran?', text: 'Status pembayaran diubah menjadi processing dan menunggu verifikasi.', confirmText: 'Ya, Konfirmasi' },
  proses: { icon: 'question', title: 'Mulai Proses Pendaftar?', text: 'Pendaftaran disetujui dan pendaftar masuk tahap proses.', confirmText: 'Ya, Proses' },
  selesai: { icon: 'question', title: 'Selesaikan Pendaftar?', text: 'Pendaftar ditandai selesai dan pembayaran terverifikasi.', confirmText: 'Ya, Selesaikan' },
  ditangguhkan: { icon: 'warning', title: 'Tangguhkan Pendaftar?', text: 'Status ditangguhkan karena uang belum masuk.', confirmText: 'Ya, Tangguhkan' },
  batal: { icon: 'warning', title: 'Batalkan Pendaftar?', text: 'Pendaftar akan dibatalkan dan data tidak bisa diproses lagi.', confirmText: 'Ya, Batalkan' },
}

function Field({ icon: Icon, label, value, sub }: { icon: any; label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3.5 py-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[#0E6187] shadow-sm ring-1 ring-slate-200/70">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{value || '-'}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: any; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0E6187]/10 text-[#0E6187]"><Icon size={15} /></span>
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export default function PendaftarDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pendaftar, setPendaftar] = useState<any>(null)
  const [detail, setDetail] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!id) return
    if (!silent) setLoading(true)
    try {
      const [pendaftarRes, riwayatRes, itemRes] = await Promise.all([
        pendaftarApi.show(Number(id)),
        pendaftarApi.riwayatPembayaran(Number(id)),
        api.get(`/pembayaran-item/${id}`).catch(() => ({ data: { items: [] } })),
      ])
      setPendaftar(pendaftarRes.data)
      setRiwayat(riwayatRes.data || [])
      setDetail(itemRes.data?.items || itemRes.data || [])
    } catch {
      setPendaftar(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const totals = detail.reduce((acc, d) => {
    const biaya = Number(d.biaya || d.harga || 0)
    if (biaya <= 0) return acc
    return {
      tagihan: acc.tagihan + biaya,
      dibayar: acc.dibayar + Number(d.dibayar || d.jumlah || 0),
    }
  }, { tagihan: 0, dibayar: 0 })

  if (!detail.length && pendaftar) {
    totals.tagihan = Math.max(0, Number(pendaftar.product?.harga || 0) - Number(pendaftar.diskon || 0))
    totals.dibayar = Number(pendaftar.nominal || 0)
  }
  const sisa = Math.max(0, totals.tagihan - totals.dibayar)
  const persen = totals.tagihan > 0 ? Math.min(100, Math.round((totals.dibayar / totals.tagihan) * 100)) : 0

  const handleStatus = async (key: string) => {
    const target = STATUS_ACTIONS[key]
    if (!target || !id) return
    const msg = CONFIRM_MSG[key]
    const result = await Swal.fire({
      icon: msg.icon,
      title: msg.title,
      text: msg.text,
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      cancelButtonColor: '#6b7280',
      confirmButtonText: msg.confirmText,
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    setBusy(key)
    try {
      await pendaftarApi.updateStatus(Number(id), {
        status_pembayaran: target.status_pembayaran,
        status_pendaftaran: target.status_pendaftaran,
      })
      setPendaftar((prev: any) => (prev ? { ...prev, ...target } : prev))
      await load(true)
      Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
    } finally {
      setBusy('')
    }
  }

  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Pendaftar?',
      text: `Data ${pendaftar.nama} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    setBusy('hapus')
    try {
      await pendaftarApi.destroy(Number(id))
      Swal.fire({ icon: 'success', title: 'Pendaftar dihapus', timer: 1500, showConfirmButton: false })
      navigate('/pendaftar')
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus pendaftar' })
      setBusy('')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
        <div className="h-9 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="h-52 animate-pulse rounded-md bg-slate-200/70" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-md bg-slate-100" />
          <div className="h-44 animate-pulse rounded-md bg-slate-100" />
        </div>
        <div className="h-56 animate-pulse rounded-md bg-slate-100" />
      </div>
    )
  }

  if (!pendaftar) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="rounded-md border border-dashed border-slate-300 bg-white py-16 text-center">
          <AlertTriangle size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">Pendaftar tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-400">Data mungkin sudah dihapus atau ID tidak valid.</p>
          <button onClick={() => navigate('/pendaftar')}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5475]">
            <ArrowLeft size={15} /> Kembali ke daftar
          </button>
        </div>
      </div>
    )
  }

  const alamat = [pendaftar.alamat, pendaftar.desa && `Desa ${pendaftar.desa}`, pendaftar.kecamatan, pendaftar.kabupaten, pendaftar.provinsi]
    .filter(Boolean).join(', ')
  const step = stepIndex(pendaftar)
  const adaTagihan = detail.length > 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/pendaftar')}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-800">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(`/pendaftar/${id}/invoice`)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0d5475]">
            <FileText size={16} /> <span className="hidden sm:inline">Lihat Invoice</span><span className="sm:hidden">Invoice</span>
          </button>
          <button onClick={handleDelete} disabled={busy === 'hapus'}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60">
            {busy === 'hapus' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden sm:inline">Hapus Pendaftar</span><span className="sm:hidden">Hapus</span>
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-md bg-gradient-to-br from-[#0E6187] via-[#0b5173] to-[#083a54] shadow-lg shadow-[#0E6187]/20">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-white/15 text-xl font-bold text-white ring-1 ring-white/25 backdrop-blur-sm sm:h-16 sm:w-16 sm:text-2xl">
              {inisial(pendaftar.nama)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-white sm:text-2xl">{pendaftar.nama}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75 sm:text-sm">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {pendaftar.email || '-'}</span>
                {pendaftar.no_registrasi && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 font-mono text-white/90 ring-1 ring-white/15">
                    <UserRound size={13} /> {pendaftar.no_registrasi}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Daftar {tgl(pendaftar.created_at)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
                  Pendaftaran: {statusBadge(pendaftar.status_pendaftaran)}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold shadow-sm ${statusChip(pendaftar.status_pembayaran)}`}>
                  Pembayaran: {statusBadge(pendaftar.status_pembayaran)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:w-[430px]">
            {[
              { label: 'Total Tagihan', value: totals.tagihan, chip: 'bg-white/10 text-white ring-white/20' },
              { label: 'Sudah Bayar', value: totals.dibayar, chip: 'bg-emerald-400/20 text-emerald-50 ring-emerald-300/30' },
              { label: 'Sisa Tagihan', value: sisa, chip: sisa > 0 ? 'bg-amber-400/20 text-amber-50 ring-amber-300/30' : 'bg-white/10 text-white ring-white/20' },
            ].map((s) => (
              <div key={s.label} className={`rounded-md px-3 py-2.5 text-center ring-1 ${s.chip}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{s.label}</p>
                <p className="mt-0.5 text-xs font-bold sm:text-sm">{s.value > 0 ? `Rp ${fmt(s.value)}` : '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/10 px-5 py-3 sm:px-6">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/80">
            <span>Progres pembayaran</span>
            <span>{persen}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${persen}%`, background: persen >= 100 ? '#34d399' : '#fbbf24' }} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ol className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {PAYMENT_STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={s.key} className="relative">
                {i > 0 && (
                  <span className={`absolute -left-1/2 top-4 h-0.5 w-full sm:-left-3 sm:top-5 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
                <div className="relative flex flex-col items-center gap-1.5 text-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ring-4 ring-white sm:h-9 sm:w-9 ${
                    done ? 'bg-emerald-600 text-white' : active ? 'bg-[#0E6187] text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {done ? <Check size={15} /> : i + 1}
                  </span>
                  <span className={`text-[10px] font-semibold leading-tight sm:text-xs ${done ? 'text-emerald-700' : active ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Data Diri" icon={UserRound}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field icon={Phone} label="Telepon" value={pendaftar.telepon} />
            <Field icon={Info} label="NIK" value={pendaftar.nik} />
            <div className="sm:col-span-2">
              <Field icon={MapPin} label="Alamat" value={alamat} sub={pendaftar.provinsi ? `Provinsi: ${pendaftar.provinsi}` : undefined} />
            </div>
            <Field icon={Landmark} label="Rekening Pengirim" value={pendaftar.nama_rekening ? `${pendaftar.nama_rekening} · ${pendaftar.bank_asal || '-'}` : '-'} sub={pendaftar.nominal ? `Nominal: Rp ${fmt(pendaftar.nominal)}` : undefined} />
            <Field icon={CalendarDays} label="Tanggal Persetujuan" value={tgl(pendaftar.tanggal_persetujuan)} />
          </div>
        </Panel>

        <Panel title="Program & Batch" icon={Layers}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field icon={Layers} label="Program" value={pendaftar.product?.nama} sub={pendaftar.product?.harga ? `Harga dasar: Rp ${fmt(pendaftar.product.harga)}` : undefined} />
            </div>
            <Field icon={CalendarDays} label="Batch" value={pendaftar.batch?.nama_batch} sub={pendaftar.batch?.tanggal_mulai ? `Mulai ${tgl(pendaftar.batch.tanggal_mulai)}` : undefined} />
            <Field icon={Percent} label="Diskon" value={pendaftar.diskon ? rp(pendaftar.diskon) : 'Tanpa diskon'} />
            <Field icon={CreditCard} label="Status Pembayaran" value={statusBadge(pendaftar.status_pembayaran)} />
            <Field icon={BadgeCheck} label="Status Pendaftaran" value={statusBadge(pendaftar.status_pendaftaran)} />
          </div>
        </Panel>
      </div>

      {adaTagihan ? (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0E6187]/10 text-[#0E6187]"><Wallet size={15} /></span>
              Tagihan per Kategori
            </h2>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{detail.length} kategori</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 text-left font-semibold sm:px-5">Kategori</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Biaya</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Dibayar</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Sisa</th>
                  <th className="px-4 py-2.5 text-left font-semibold sm:px-5">Progres</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((d: any) => {
                  const biaya = Number(d.biaya || d.harga || 0)
                  const dibayar = Number(d.dibayar || d.jumlah || 0)
                  const kurang = Math.max(0, biaya - dibayar)
                  const pct = biaya > 0 ? Math.min(100, Math.round((dibayar / biaya) * 100)) : 0
                  return (
                    <tr key={d.kategori_id || d.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-semibold text-slate-800">{d.nama || d.kategori?.nama || '-'}</p>
                        {d.due_at && <p className="mt-0.5 text-[11px] text-slate-400">Jatuh tempo {tgl(d.due_at)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{rp(biaya)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{rp(dibayar)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${kurang > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{kurang > 0 ? rp(kurang) : 'Lunas'}</span>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 sm:w-24">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#059669' : '#0E6187' }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/80 text-sm font-bold">
                  <td className="px-4 py-3 text-slate-700 sm:px-5">Total</td>
                  <td className="px-4 py-3 text-right text-slate-800">{rp(totals.tagihan)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{rp(totals.dibayar)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{rp(sisa)}</td>
                  <td className="px-4 py-3 text-slate-600 sm:px-5">{persen}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#0E6187]/10 text-[#0E6187]"><Receipt size={15} /></span>
            Riwayat Pembayaran
          </h2>
          {riwayat.length > 0 && (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{riwayat.length} transaksi</span>
          )}
        </div>
        {riwayat.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Receipt size={34} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-semibold text-slate-500">Belum ada transaksi</p>
            <p className="mt-0.5 text-xs text-slate-400">Riwayat pembayaran akan muncul setelah pendaftar melakukan pembayaran.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 text-left font-semibold sm:px-5">Kategori</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Jumlah</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Bukti</th>
                  <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">{r.kategori?.nama || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">Rp {fmt(Number(r.jumlah))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusChip(r.status)}`}>
                        {r.status === 'verified' && <CheckCircle size={12} />}
                        {statusBadge(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.bukti_pembayaran ? (
                        <a href={`${APP_URL}/storage/${r.bukti_pembayaran}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0E6187] transition-colors hover:border-[#0E6187]/40 hover:bg-[#0E6187]/5">
                          <FileText size={12} /> Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 sm:px-5">{tgl(r.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Panel title="Ubah Status Pendaftar" icon={RefreshCw}
        action={<span className="hidden text-[11px] text-slate-400 sm:block">Pilih aksi, lalu konfirmasi</span>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.keys(STATUS_ACTIONS).map((key) => {
            const { icon: Icon, chip } = STATUS_ACTIONS[key]
            const aktif = pendaftar.status_pembayaran === STATUS_ACTIONS[key].status_pembayaran
              && pendaftar.status_pendaftaran === STATUS_ACTIONS[key].status_pendaftaran
            return (
              <button key={key} onClick={() => handleStatus(key)} disabled={busy === key}
                className={`inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all disabled:opacity-60 sm:text-sm ${chip} ${aktif ? 'ring-2 ring-[#0E6187]/30' : ''}`}>
                {busy === key ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                {STATUS_ACTIONS_LABEL[key]}
              </button>
            )
          })}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <AlertTriangle size={13} className="mt-px shrink-0" />
          Perubahan status langsung tersimpan dan riwayat pembayaran ikut diperbarui tanpa refresh halaman.
        </p>
      </Panel>

      <div className="pb-2 text-center">
        <button onClick={() => navigate(`/pendaftar/${id}/invoice`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6187] hover:underline">
          Buka invoice lengkap <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
