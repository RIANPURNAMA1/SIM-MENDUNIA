import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, Upload, X, Eye, FileText, ChevronRight, Building2, Copy } from 'lucide-react'
import Swal from 'sweetalert2'
import api, { APP_URL } from '../../services/api'

// Class bergaya kartu Facebook
const fbCardClass = "bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.12)]"

function getDeadlineInfo(dueAt?: string | null): { deadline: Date; diff: number; days: number; hours: number; minutes: number; expired: boolean; formatted: string } | null {
  if (!dueAt) return null
  const deadline = new Date(dueAt)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const expired = diff <= 0
  const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24))
  const hours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))
  const formatted = deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  return { deadline, diff, days, hours, minutes, expired, formatted }
}

interface Kategori {
  id: number
  kode: string
  nama: string
  urutan: number
  parent_id: number | null
}

interface KategoriItem {
  kategori_id: number
  kode: string
  nama: string
  biaya: number
  dibayar: number
  jatuh_tempo_hari?: number
  due_at?: string | null
  kode_unik?: number
  total_transfer?: number
  payment_code?: string | null
}

interface BankAccount {
  id: number
  bank_name: string
  bank_logo: string | null
  bank_logo_url: string | null
  account_holder: string
  account_number: string
  branch: string | null
  additional_info: string | null
  is_active: boolean
}

export default function PembayaranSiswa() {
  const [pendaftar, setPendaftar] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [kategoris, setKategoris] = useState<Kategori[]>([])
  const [kategoriItems, setKategoriItems] = useState<KategoriItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [jumlah, setJumlah] = useState('')
  const [jumlahDisplay, setJumlahDisplay] = useState('')
  const [bankPengirim, setBankPengirim] = useState('')
  const [namaPengirim, setNamaPengirim] = useState('')
  const [bukti, setBukti] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [banks, setBanks] = useState<{ kode: string; nama: string }[]>([])
  const [ewallets, setEwallets] = useState<{ kode: string; nama: string }[]>([])
  const [company, setCompany] = useState<{ bank_nama: string; bank_nomor_rekening: string; bank_pemilik: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [tanggalPersetujuan, setTanggalPersetujuan] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [paymentSettings, setPaymentSettings] = useState<{ manual_payment_enabled: boolean; unique_code_max: number; unique_code_operation: string } | null>(null)

  function loadData() {
    setLoading(true)
    Promise.all([
      api.get('/siswa-dashboard'),
      api.get('/biaya-kategori-flat'),
    ]).then(([siswaRes, katRes]) => {
      const p = siswaRes.data.pendaftar
      setPendaftar(p)
      setKategoris(katRes.data || [])
      if (p) {
        api.get(`/pendaftar/${p.id}/riwayat-pembayaran`).then(r => setRiwayat(r.data)).catch(() => {})
        api.get(`/pembayaran-item/${p.id}`).then(r => {
          setKategoriItems(r.data.items || [])
          setTanggalPersetujuan(r.data.tanggal_persetujuan || p.tanggal_persetujuan || null)
        }).catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  useEffect(() => {
    api.get('/banks').then(r => {
      setBanks(r.data?.banks || [])
      setEwallets(r.data?.ewallets || [])
    }).catch(() => {})
    api.get('/company-profile').then(r => {
      const c = r.data?.data || r.data
      if (c) setCompany({ bank_nama: c.bank_nama || 'BCA', bank_nomor_rekening: c.bank_nomor_rekening || '1831813364', bank_pemilik: c.bank_pemilik || 'PT. INDONESIA SUKSES MENDUNIA' })
    }).catch(() => {})
    api.get('/bank-accounts-public').then(r => {
      setBankAccounts(r.data || [])
    }).catch(() => {})
    api.get('/payment-settings').then(r => {
      const s = r.data
      setPaymentSettings({
        manual_payment_enabled: s.manual_payment_enabled?.is_enabled ?? false,
        unique_code_max: parseInt(s.unique_code_max?.value ?? '99'),
        unique_code_operation: s.unique_code_operation?.value ?? 'add',
      })
    }).catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const diskon = Number(pendaftar?.diskon || 0)
  
  const itemByKategoriId = new Map<number, KategoriItem>()
  for (const item of kategoriItems) {
    itemByKategoriId.set(item.kategori_id, item)
  }

  const katByNameLower = new Map<string, Kategori>()
  for (const kat of kategoris) {
    katByNameLower.set(kat.nama.toLowerCase(), kat)
  }

  const childrenMap = new Map<number, number[]>()
  const ensureParent = (pid: number) => {
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
  }
  for (const kat of kategoris) {
    if (kat.parent_id) {
      ensureParent(kat.parent_id)
      childrenMap.get(kat.parent_id)!.push(kat.id)
    }
  }

  const walkProductTree = (items: any[]) => {
    for (const item of items) {
      const name = (item.name || '').toLowerCase()
      const kat = katByNameLower.get(name)
      if (!kat) continue
      const children = item.children || []
      if (children.length > 0) {
        ensureParent(kat.id)
        for (const c of children) {
          const cKat = katByNameLower.get((c.name || '').toLowerCase())
          if (cKat && cKat.parent_id !== kat.id) {
            ensureParent(kat.id)
            const existing = childrenMap.get(kat.id) || []
            if (!existing.includes(cKat.id)) {
              existing.push(cKat.id)
              childrenMap.set(kat.id, existing)
            }
          }
        }
        walkProductTree(children)
      }
    }
  }

  const productKategoriItems = pendaftar?.product?.kategori_items as { name: string; harga: number; komisi: number; children: any[] }[] | undefined
  if (productKategoriItems && productKategoriItems.length > 0) {
    walkProductTree(productKategoriItems)
  }

  const getAllChildIds = (parentId: number, visited = new Set<number>()): number[] => {
    if (visited.has(parentId)) return []
    visited.add(parentId)
    const ids: number[] = []
    const children = childrenMap.get(parentId) || []
    for (const cid of children) {
      ids.push(cid)
      ids.push(...getAllChildIds(cid, visited))
    }
    return ids
  }

  const orderedColumns: Kategori[] = []
  const uniqueCodeOp = paymentSettings?.unique_code_operation ?? 'add'

  const aggregatedItems: KategoriItem[] = []
  const processedIds = new Set<number>()

  const walkProductDisplay = (items: any[], depth: number) => {
    for (const item of items) {
      const name = (item.name || '').toLowerCase()
      const kat = katByNameLower.get(name)
      if (!kat || processedIds.has(kat.id)) continue

      if (depth === 0) {
        const descendantIds = getAllChildIds(kat.id)
        const allIds = [kat.id, ...descendantIds]
        const hasAny = allIds.some(id => itemByKategoriId.has(id))
        if (!hasAny) continue

        let totalBiaya = 0
        let totalDibayar = 0
        let dueAt: string | null = null
        let jatuhTempoHari = 30

        for (const id of allIds) {
          const kItem = itemByKategoriId.get(id)
          if (kItem) {
            const effBiaya = uniqueCodeOp === 'subtract' && kItem.total_transfer ? Number(kItem.total_transfer) : Number(kItem.biaya)
            totalBiaya += effBiaya
            totalDibayar += Number(kItem.dibayar)
            if (kItem.due_at && (!dueAt || kItem.due_at < dueAt)) {
              dueAt = kItem.due_at
            }
            jatuhTempoHari = Math.min(jatuhTempoHari, kItem.jatuh_tempo_hari ?? 30)
            processedIds.add(id)
          }
        }

        orderedColumns.push(kat)
        aggregatedItems.push({
          kategori_id: kat.id,
          kode: kat.kode,
          nama: kat.nama,
          biaya: totalBiaya,
          dibayar: totalDibayar,
          jatuh_tempo_hari: jatuhTempoHari,
          due_at: dueAt,
        })
      }

      const children = item.children || []
      if (children.length > 0) {
        walkProductDisplay(children, depth + 1)
      }
    }
  }

  if (productKategoriItems && productKategoriItems.length > 0) {
    walkProductDisplay(productKategoriItems, 0)
  }

  for (const item of kategoriItems) {
    if (!processedIds.has(item.kategori_id)) {
      const kat = kategoris.find(k => k.id === item.kategori_id)
      if (kat && !kat.parent_id) {
        processedIds.add(item.kategori_id)
        orderedColumns.push(kat)
        aggregatedItems.push(item)
      }
    }
  }

  const parentColumns = orderedColumns
  const parentAggregatedItems = aggregatedItems

  const totalBiaya = parentAggregatedItems.reduce((s, i) => s + i.biaya, 0)
  const totalDibayar = parentAggregatedItems.reduce((s, i) => s + i.dibayar, 0)
  const effectiveTotalBiaya = totalBiaya - diskon
  const tunggakan = effectiveTotalBiaya - totalDibayar

  // Hitung total verified per kategori dari riwayat
  const verifiedPerKategori = new Map<number, number>()
  const pendingPerKategori = new Map<number, number>()
  if (riwayat?.length) {
    for (const r of riwayat) {
      if (!r.kategori_id) continue
      if (r.status === 'verified') {
        verifiedPerKategori.set(r.kategori_id, (verifiedPerKategori.get(r.kategori_id) || 0) + Number(r.jumlah))
      } else if (r.status === 'pending' || r.status === 'processing') {
        pendingPerKategori.set(r.kategori_id, (pendingPerKategori.get(r.kategori_id) || 0) + Number(r.jumlah))
      }
    }
  }

  // Aggregate verified/pending amounts across parent + all children per group
  const groupVerified = new Map<number, number>()
  const groupPending = new Map<number, number>()
  for (const i of parentAggregatedItems) {
    const descendantIds = getAllChildIds(i.kategori_id)
    const allIds = [i.kategori_id, ...descendantIds]
    let tv = 0
    let tp = 0
    for (const id of allIds) {
      tv += verifiedPerKategori.get(id) || 0
      tp += pendingPerKategori.get(id) || 0
    }
    groupVerified.set(i.kategori_id, tv)
    groupPending.set(i.kategori_id, tp)
  }

  const paidKategoriIds = parentAggregatedItems.filter(i => {
    if (i.biaya <= 0) return false
    const effectiveBiaya = totalBiaya > 0 ? Math.round(i.biaya - (diskon * i.biaya / totalBiaya)) : i.biaya
    const verified = groupVerified.get(i.kategori_id) || 0
    return verified >= effectiveBiaya
  }).map(i => i.kategori_id)
  const partialKategoriIds = parentAggregatedItems.filter(i => {
    const effectiveBiaya = totalBiaya > 0 ? Math.round(i.biaya - (diskon * i.biaya / totalBiaya)) : i.biaya
    const verified = groupVerified.get(i.kategori_id) || 0
    const pending = groupPending.get(i.kategori_id) || 0
    return (verified > 0 && verified < effectiveBiaya) || (verified === 0 && pending > 0 && pending < effectiveBiaya)
  }).map(i => i.kategori_id)

  const pendingKategoriIds = new Set<number>()
  for (const i of parentAggregatedItems) {
    if (!paidKategoriIds.includes(i.kategori_id)) {
      const pending = groupPending.get(i.kategori_id) || 0
      if (pending > 0) {
        pendingKategoriIds.add(i.kategori_id)
      }
    }
  }

  const sortedKat = parentColumns
  const nextKat = sortedKat.find(k => {
    const item = parentAggregatedItems.find(i => i.kategori_id === k.id)
    if (!item) return true
    const effectiveBiaya = totalBiaya > 0 ? Math.round(item.biaya - (diskon * item.biaya / totalBiaya)) : item.biaya
    return item.dibayar < effectiveBiaya
  }) || null

  const hasPendingPayment = riwayat.some(r => r.status === 'pending')

  function openModal() {
    if (hasPendingPayment) {
      Swal.fire({
        icon: 'info',
        title: 'Pembayaran Sedang Diproses',
        html: '<p style="text-align:left">Anda sudah melakukan pembayaran yang sedang menunggu verifikasi dari admin.<br><br>Mohon tunggu admin akan mengecek dan memverifikasi pembayaran Anda sebelum melakukan pembayaran baru.</p>',
        confirmButtonColor: '#0E6187',
        confirmButtonText: 'Mengerti',
      })
      return
    }
    setJumlah('')
    setJumlahDisplay('')
    setBankPengirim('')
    setNamaPengirim('')
    setBukti(null)
    setError('')
    setShowModal(true)
  }

  function parseFormatted(value: string): string {
    return value.replace(/[^0-9]/g, '')
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  function handleJumlahInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseFormatted(e.target.value)
    setJumlah(raw)
    setJumlahDisplay(raw ? Number(raw).toLocaleString('id-ID') : '')
  }

  function getDistribusiPreview(jml: number) {
    const preview: { nama: string; biaya: number; dibayar: number; bayar: number; lunas: boolean }[] = []
    let sisa = jml
    for (const k of sortedKat) {
      if (sisa <= 0) break
      const item = parentAggregatedItems.find(i => i.kategori_id === k.id)
      const rawBiaya = item?.biaya || 0
      const biaya = totalBiaya > 0 ? Math.round(rawBiaya - (diskon * rawBiaya / totalBiaya)) : rawBiaya
      const dibayar = item?.dibayar || 0
      const kurang = biaya - dibayar
      if (kurang <= 0) continue
      const bayar = Math.min(sisa, kurang)
      sisa -= bayar
      preview.push({ nama: k.nama, biaya, dibayar, bayar, lunas: dibayar + bayar >= biaya })
    }
    return preview
  }

  const distribusiPreview = jumlah ? getDistribusiPreview(Number(jumlah)) : []

  async function handleBayar(e: React.FormEvent) {
    e.preventDefault()
    if (!jumlah || Number(jumlah) <= 0) return setError('Masukkan jumlah pembayaran')
    if (!bankPengirim) return setError('Pilih bank / e-wallet pengirim')
    if (!namaPengirim) return setError('Masukkan nama pengirim')
    if (!bukti) return setError('Upload bukti pembayaran')

    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('jumlah', jumlah)
      fd.append('bank_pengirim', bankPengirim)
      fd.append('nama_pengirim', namaPengirim)
      fd.append('bukti_pembayaran', bukti)
      const res = await api.post(`/pendaftar/${pendaftar.id}/bayar-all`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPendaftar(res.data.pendaftar)
      setShowModal(false)
      setJumlah('')
      setJumlahDisplay('')
      setBukti(null)
      api.get(`/pendaftar/${pendaftar.id}/riwayat-pembayaran`).then(r => setRiwayat(r.data)).catch(() => {})
      api.get(`/pembayaran-item/${pendaftar.id}`).then(r => setKategoriItems(r.data.items || [])).catch(() => {})
      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Terkirim!',
        text: 'Bukti pembayaran Anda telah dikirim dan menunggu verifikasi.',
        confirmButtonColor: '#0E6187',
        timer: 3000,
        showConfirmButton: false,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] px-3 py-4 sm:px-6 sm:py-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-3 sm:space-y-4">
        
        {/* HEADER CARD - Mobile: centered, Desktop: left-aligned */}
        <div className={`${fbCardClass} p-4 sm:p-4`}>
          <div className="flex items-center gap-3 sm:justify-start justify-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <CreditCard size={20} className="text-[#0E6187]" />
            </div>
            <div className="sm:text-left text-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Keuangan Anda</h1>
              <p className="text-[12px] sm:text-[13px] text-gray-500">Kelola dan pantau pembayaran pendaftaran</p>
            </div>
          </div>
        </div>

        {pendaftar ? (
          <>
            {/* MAIN INFO CARD */}
            <div className={`${fbCardClass} overflow-hidden`}>
              
              {/* STATUS BAR */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
                <span className="text-[14px] sm:text-[15px] font-semibold text-gray-900">Status Akun</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[12px] sm:text-sm font-semibold ${
                  pendaftar.status_pembayaran === 'verified' ? 'bg-[#E7F3EC] text-[#1C7A41]' : 'bg-[#FFF3CD] text-[#856404]'
                }`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    pendaftar.status_pembayaran === 'verified' ? 'bg-[#1C7A41]' : 'bg-[#856404]'
                  }`} />
                  {pendaftar.status_pembayaran === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                </span>
              </div>

              {/* TAHAPAN PEMBAYARAN */}
              {sortedKat.length > 0 && (
                <div className="px-4 py-3 sm:py-4 border-b border-gray-100">
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-2.5 sm:mb-3">Tahapan Pembayaran</h3>
                  <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
                    {sortedKat.map((k, idx) => {
                      const item = aggregatedItems.find(i => i.kategori_id === k.id)
                      const isLunas = paidKategoriIds.includes(k.id)
                      const isPartial = partialKategoriIds.includes(k.id) || pendingKategoriIds.has(k.id)
                      const isNext = k.id === nextKat?.id
                      const rawBiaya = item?.biaya || 0
                      const katDibayar = item?.dibayar || 0
                      const katBiaya = totalBiaya > 0 ? Math.round(rawBiaya - (diskon * rawBiaya / totalBiaya)) : rawBiaya
                      const isUnpaid = !isLunas && katBiaya > 0
                      const jatuhTempoHari = item?.jatuh_tempo_hari ?? 30
                      const dueAt = item?.due_at
                      const deadlineInfo = isUnpaid ? getDeadlineInfo(dueAt) : null

                      return (
                        <div key={k.id} className={`snap-start flex-none w-[140px] sm:w-[130px] flex flex-col p-3 rounded-xl border transition-all ${
                          isLunas ? 'border-[#E7F3EC] bg-[#F7FBF9]' 
                          : isPartial ? 'border-blue-100 bg-blue-50/50' 
                          : isNext ? 'border-gray-200 bg-white shadow-sm' 
                          : 'border-transparent bg-gray-50'
                        }`}>
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[12px] sm:text-sm font-bold mb-2 ${
                            isLunas ? 'bg-[#1C7A41] text-white' 
                            : isPartial ? 'bg-[#0866FF] text-white' 
                            : isNext ? 'bg-gray-200 text-gray-800' 
                            : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isLunas ? <CheckCircle size={14} /> : isPartial ? <Clock size={14} /> : idx + 1}
                          </div>
                          <p className={`text-[11px] sm:text-[12px] font-semibold leading-tight line-clamp-2 ${
                            isLunas ? 'text-[#1C7A41]' : isPartial ? 'text-[#0866FF]' : isNext ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {k.nama}
                          </p>
                          {katBiaya > 0 && (
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-1">
                              Rp {katBiaya.toLocaleString('id-ID')}
                            </p>
                          )}
                          <span className={`mt-1.5 inline-block w-fit text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isLunas ? 'bg-[#E7F3EC] text-[#1C7A41]'
                            : isPartial ? 'bg-blue-100 text-[#0866FF]'
                            : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isLunas ? 'Lunas' : isPartial ? 'Proses' : 'Belum'}
                          </span>
                          {deadlineInfo && (
                            <div className={`mt-2 text-[8px] sm:text-[9px] font-semibold rounded-md px-1.5 py-1 ${
                              deadlineInfo.expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {deadlineInfo.expired ? (
                                <span>Lewat {deadlineInfo.days}h</span>
                              ) : (
                                <span>{deadlineInfo.days}h {deadlineInfo.hours}j</span>
                              )}
                              <span className="block text-[7px] sm:text-[8px] font-normal opacity-75">s/d {deadlineInfo.formatted}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* RINGKASAN & ACTION */}
              <div className="px-4 py-3 sm:py-4 bg-white">
                <h3 className="text-[13px] sm:text-[14px] font-bold text-gray-900 mb-2.5 sm:mb-3">Ringkasan Biaya</h3>
                <div className="space-y-2.5 sm:space-y-3 bg-gray-50 p-3 sm:p-4 rounded-xl">
                  {pendaftar.product && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] sm:text-[14px] text-gray-600">Program</span>
                      <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900 text-right truncate">{pendaftar.product.nama}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] sm:text-[14px] text-gray-600">Total Biaya</span>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                  </div>
                  {diskon > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] sm:text-[14px] text-gray-600">Diskon</span>
                      <span className="text-[13px] sm:text-[14px] font-semibold text-green-600">- Rp {diskon.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200/80 pt-2.5 sm:pt-3 mt-1 flex items-center justify-between">
                    <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900">Total Dibayar</span>
                    <span className="text-[14px] sm:text-[15px] font-bold text-[#1C7A41]">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {tunggakan > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-[12px] sm:text-[13px] text-gray-500">Sisa Tunggakan</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">Rp {tunggakan.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={openModal}
                      className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl sm:rounded-lg text-[14px] sm:text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIWAYAT / AKTIVITAS PEMBAYARAN */}
            {riwayat.length > 0 && (
              <div className={`${fbCardClass} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900">Aktivitas Pembayaran</h2>
                </div>
                <div className="flex flex-col">
                  {riwayat.map((r, i) => (
                    <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                          <FileText size={18} className="sm:hidden" />
                          <FileText size={20} className="hidden sm:block" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 truncate">
                              {r.kategori?.nama || 'Pembayaran ke-' + (riwayat.length - i)}
                            </p>
                            <span className="text-[13px] sm:text-[15px] font-bold text-gray-900 shrink-0">Rp {Number(r.jumlah).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span className="text-[11px] sm:text-[12px] text-gray-500">
                              {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-gray-300 text-[11px] sm:text-[12px]">•</span>
                            <span className={`text-[11px] sm:text-[12px] font-semibold ${
                              r.status === 'verified' ? 'text-[#1C7A41]' : r.status === 'ditolak' ? 'text-red-600' : 'text-[#856404]'
                            }`}>
                              {r.status === 'verified' ? 'Selesai' : r.status === 'ditolak' ? 'Ditolak' : 'Diproses'}
                            </span>
                          </div>
                          <a
                            href={`${APP_URL}/storage/${r.bukti_pembayaran}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 mt-1.5 text-[11px] sm:text-[12px] font-semibold text-[#0866FF] hover:underline"
                          >
                            Lihat Bukti <ChevronRight size={12} className="sm:hidden" />
                            <ChevronRight size={14} className="hidden sm:block" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAYMENT MODAL - Full screen on mobile, centered on desktop */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4" onClick={() => setShowModal(false)}>
                <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-white sm:border sm:border-gray-200 sm:shadow-sm max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal header */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-xl">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">Bayar Tunggakan</h2>
                    <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-gray-100 transition-colors active:bg-gray-200">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-6">
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl sm:rounded-md text-[13px] sm:text-sm text-red-600">{error}</div>
                    )}

                    <form onSubmit={handleBayar} className="space-y-4">
                      {/* Ringkasan tunggakan */}
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                        <div className="flex justify-between text-[13px] sm:text-sm">
                          <span className="text-gray-500">Program</span>
                          <span className="font-semibold text-gray-900 text-right truncate ml-2">{pendaftar.product?.nama}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rincian Tunggakan Per Kategori</p>
                          <div className="space-y-2">
                            {parentAggregatedItems.filter(i => i.biaya > 0).map((item, idx) => {
                              const rawBiaya = item.biaya
                              const effBiaya = totalBiaya > 0 ? Math.round(rawBiaya - (diskon * rawBiaya / totalBiaya)) : rawBiaya
                              const sisa = effBiaya - item.dibayar
                              if (sisa <= 0) return null
                              return (
                                <div key={idx} className="bg-white rounded-xl sm:rounded-lg border border-gray-200 p-3">
                                  <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <span className="text-[13px] sm:text-sm font-semibold text-gray-900 truncate">{item.nama}</span>
                                    <span className="text-[11px] sm:text-xs font-bold text-red-600 shrink-0">Sisa Rp {sisa.toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs flex-wrap">
                                    <span className="text-gray-500">Biaya: Rp {effBiaya.toLocaleString('id-ID')}</span>
                                    <span className="text-gray-300 hidden sm:inline">|</span>
                                    <span className="text-emerald-600">Dibayar: Rp {item.dibayar.toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${effBiaya > 0 ? Math.min(100, (item.dibayar / effBiaya) * 100) : 0}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                          <span className="text-[13px] sm:text-sm font-semibold text-gray-600">Total Tunggakan</span>
                          <span className="text-[15px] sm:text-base font-bold text-gray-900">Rp {tunggakan.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Informasi rekening tujuan */}
                      {company && bankAccounts.length === 0 && (
                        <div className="bg-[#E8FAFF] border border-blue-100 rounded-xl sm:rounded-lg p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 size={15} className="text-[#0E6187] shrink-0" />
                            <p className="text-[12px] sm:text-[13px] font-bold text-gray-800">Informasi Rekening Tujuan</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[13px] sm:text-sm gap-2">
                              <span className="text-gray-500 shrink-0">Nama Bank</span>
                              <span className="font-semibold text-gray-900 text-right">{company.bank_nama}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px] sm:text-sm gap-2">
                              <span className="text-gray-500 shrink-0">Atas Nama</span>
                              <span className="font-semibold text-gray-900 text-right truncate">{company.bank_pemilik}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px] sm:text-sm gap-2">
                              <span className="text-gray-500 shrink-0">No. Rekening</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold font-mono text-[#0E6187]">{company.bank_nomor_rekening}</span>
                                <button type="button" onClick={() => copyToClipboard(company.bank_nomor_rekening, 'rek')}
                                  className="p-1.5 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors" title="Salin">
                                  <Copy size={13} className={copiedField === 'rek' ? 'text-green-600' : 'text-gray-400'} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {bankAccounts.filter(b => b.is_active).length > 0 && (
                        <div className="bg-[#E8FAFF] border border-blue-100 rounded-xl sm:rounded-lg p-3 sm:p-4 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 size={15} className="text-[#0E6187] shrink-0" />
                            <p className="text-[12px] sm:text-[13px] font-bold text-gray-800">Informasi Rekening Tujuan</p>
                          </div>
                          {bankAccounts.filter(b => b.is_active).map(acc => (
                            <div key={acc.id} className="border-t border-blue-200 pt-3 first:border-0 first:pt-0">
                              <div className="flex items-center gap-2 mb-2">
                                {acc.bank_logo_url ? (
                                  <img src={acc.bank_logo_url} alt={acc.bank_name} className="w-5 h-5 sm:w-6 sm:h-6 rounded object-contain" />
                                ) : (
                                  <Building2 size={13} className="text-[#0E6187]" />
                                )}
                                <span className="text-[12px] sm:text-[13px] font-bold text-gray-800">{acc.bank_name}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[13px] sm:text-sm gap-2">
                                  <span className="text-gray-500 shrink-0">Atas Nama</span>
                                  <span className="font-semibold text-gray-900 text-right truncate">{acc.account_holder}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px] sm:text-sm gap-2">
                                  <span className="text-gray-500 shrink-0">No. Rekening</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold font-mono text-[#0E6187]">{acc.account_number}</span>
                                    <button type="button" onClick={() => copyToClipboard(acc.account_number, `rek-${acc.id}`)}
                                      className="p-1.5 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors" title="Salin">
                                      <Copy size={13} className={copiedField === `rek-${acc.id}` ? 'text-green-600' : 'text-gray-400'} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {acc.additional_info && (
                                <p className="mt-1.5 text-[10px] sm:text-[11px] text-gray-500">{acc.additional_info}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Form fields */}
                      <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5">Jumlah Pembayaran</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={jumlahDisplay}
                          onChange={handleJumlahInput}
                          className="w-full px-4 py-3 sm:py-2.5 bg-white border border-gray-300 rounded-xl sm:rounded focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-all text-[14px] sm:text-sm min-h-[48px]"
                          placeholder={`Maksimal Rp ${tunggakan.toLocaleString('id-ID')}`}
                        />
                      </div>

                      {distribusiPreview.length > 0 && (
                        <div className="border border-blue-200 bg-blue-50 rounded-xl sm:rounded-lg p-3 sm:p-4 space-y-2">
                          <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Preview Distribusi Pembayaran</p>
                          {distribusiPreview.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-[13px] sm:text-sm gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {d.lunas ? (
                                  <CheckCircle size={13} className="text-emerald-500 shrink-0 sm:hidden" />
                                ) : (
                                  <Clock size={13} className="text-amber-500 shrink-0 sm:hidden" />
                                )}
                                {d.lunas ? (
                                  <CheckCircle size={14} className="text-emerald-500 shrink-0 hidden sm:block" />
                                ) : (
                                  <Clock size={14} className="text-amber-500 shrink-0 hidden sm:block" />
                                )}
                                <span className={`${d.lunas ? 'text-emerald-700 font-medium' : 'text-gray-700'} truncate`}>{d.nama}</span>
                              </div>
                              <span className={`font-semibold shrink-0 ${d.lunas ? 'text-emerald-700' : 'text-gray-700'}`}>
                                Rp {d.bayar.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                          {Number(jumlah) > distribusiPreview.reduce((s, d) => s + d.bayar, 0) && (
                            <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between text-[13px] sm:text-sm">
                              <span className="text-blue-600">Sisa kembali</span>
                              <span className="font-bold text-blue-700">
                                Rp {(Number(jumlah) - distribusiPreview.reduce((s, d) => s + d.bayar, 0)).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5">Bank / E-Wallet Pengirim <span className="text-red-500">*</span></label>
                        <select required value={bankPengirim} onChange={e => setBankPengirim(e.target.value)}
                          className="w-full px-4 py-3 sm:py-2.5 bg-white border border-gray-300 rounded-xl sm:rounded focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-all text-[14px] sm:text-sm min-h-[48px] appearance-none">
                          <option value="">Pilih Bank / E-Wallet</option>
                          {banks.length > 0 && (
                            <optgroup label="Bank">
                              {banks.map(b => <option key={b.kode} value={b.kode}>{b.nama}</option>)}
                            </optgroup>
                          )}
                          {ewallets.length > 0 && (
                            <optgroup label="E-Wallet">
                              {ewallets.map(e => <option key={e.kode} value={e.kode}>{e.nama}</option>)}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                        <input type="text" required value={namaPengirim} onChange={e => setNamaPengirim(e.target.value)}
                          placeholder="Nama di rekening"
                          className="w-full px-4 py-3 sm:py-2.5 bg-white border border-gray-300 rounded-xl sm:rounded focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-all text-[14px] sm:text-sm min-h-[48px]" />
                      </div>

                      <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5">Upload Bukti Pembayaran</label>
                        <label className="flex flex-col items-center justify-center w-full h-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-lg cursor-pointer bg-gray-50 hover:bg-white hover:border-[#0E6187] active:bg-gray-100 transition-colors">
                          {bukti ? (
                            <div className="flex flex-col items-center">
                              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-[#0E6187]" />
                              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 font-medium text-center px-2 truncate max-w-full">{bukti.name}</p>
                              <p className="text-[9px] sm:text-[10px] text-gray-400">Klik untuk ganti</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 font-medium">Klik untuk upload</p>
                              <p className="text-[9px] sm:text-[10px] text-gray-400">.JPG, .PNG, atau .PDF</p>
                            </div>
                          )}
                          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setBukti(e.target.files?.[0] || null)} />
                        </label>
                      </div>

                      {/* Action buttons - sticky bottom on mobile */}
                      <div className="sticky bottom-0 bg-white pt-3 sm:pt-2 pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 border-t sm:border-0 border-gray-100">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 sm:flex-none px-5 sm:px-6 py-3 sm:py-2.5 border border-gray-300 text-gray-700 rounded-xl sm:rounded-md text-[14px] sm:text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]">Batal</button>
                          <button type="submit" disabled={submitting}
                            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-2.5 bg-[#0E6187] text-white rounded-xl sm:rounded-md text-[14px] sm:text-sm font-semibold hover:bg-[#1a5e6f] active:bg-[#0a4f66] transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2 min-h-[48px]">
                            {submitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`${fbCardClass} p-8 sm:p-10 text-center flex flex-col items-center`}>
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3 sm:mb-4">
              <CreditCard size={28} className="sm:hidden" />
              <CreditCard size={32} className="hidden sm:block" />
            </div>
            <h3 className="text-[16px] sm:text-lg font-bold text-gray-900">Belum ada data</h3>
            <p className="mt-1 text-[13px] sm:text-[14px] text-gray-500">Data pembayaran pendaftaran belum tersedia.</p>
          </div>
        )}
      </div>
    </div>
  )
}