import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, Upload, X, FileText, ChevronRight, Wallet, TrendingUp, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../../services/api'

const fbCardClass = "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]"

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
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const diskon = Number(pendaftar?.diskon || 0)
  
  const kategoriByName = new Map<string, { kategori: Kategori; biaya: number; dibayar: number }>()
  for (const item of kategoriItems) {
    const kat = kategoris.find(k => k.id === item.kategori_id)
    if (kat) {
      kategoriByName.set(kat.nama.toLowerCase(), { kategori: kat, biaya: item.biaya, dibayar: item.dibayar })
      kategoriByName.set(kat.kode.toLowerCase(), { kategori: kat, biaya: item.biaya, dibayar: item.dibayar })
    }
  }

  const orderedColumns: Kategori[] = []
  const matchedIds = new Set<number>()
  const childKategoriIds = new Set<number>()
  const aggregatedItems: KategoriItem[] = []

  const walkJson = (items: any[], depth: number) => {
    for (const item of items) {
      const name = (item.name || '').toLowerCase()
      const entry = kategoriByName.get(name)
      if (!entry) continue
      if (matchedIds.has(entry.kategori.id)) continue

      const children = item.children || []
      let totalBiaya = entry.biaya
      let totalDibayar = entry.dibayar

      for (const c of children) {
        const cName = (c.name || '').toLowerCase()
        const cEntry = kategoriByName.get(cName)
        if (cEntry) {
          childKategoriIds.add(cEntry.kategori.id)
          totalBiaya += cEntry.biaya
          totalDibayar += cEntry.dibayar
        }
      }

      if (depth === 0) {
        orderedColumns.push(entry.kategori)
        matchedIds.add(entry.kategori.id)
        aggregatedItems.push({
          kategori_id: entry.kategori.id,
          kode: entry.kategori.kode,
          nama: entry.kategori.nama,
          biaya: totalBiaya,
          dibayar: totalDibayar,
        })
      }

      if (children.length > 0) {
        walkJson(children, depth + 1)
      }
    }
  }

  const productKategoriItems = pendaftar?.product?.kategori_items as { name: string; harga: number; komisi: number; children: any[] }[] | undefined
  if (productKategoriItems && productKategoriItems.length > 0) {
    walkJson(productKategoriItems, 0)
  }

  for (const item of kategoriItems) {
    if (!matchedIds.has(item.kategori_id) && !childKategoriIds.has(item.kategori_id)) {
      const kat = kategoris.find(k => k.id === item.kategori_id)
      if (kat) {
        orderedColumns.push(kat)
        matchedIds.add(kat.id)
        aggregatedItems.push(item)
      }
    }
  }

  const totalBiaya = aggregatedItems.reduce((s, i) => s + i.biaya, 0)
  const totalDibayar = aggregatedItems.reduce((s, i) => s + i.dibayar, 0)
  const tunggakan = totalBiaya - totalDibayar
  const paidKategoriIds = aggregatedItems.filter(i => i.dibayar >= i.biaya && i.biaya > 0).map(i => i.kategori_id)
  const partialKategoriIds = aggregatedItems.filter(i => i.dibayar > 0 && i.dibayar < i.biaya).map(i => i.kategori_id)

  const pendingKategoriIds = new Set<number>()
  if (riwayat?.length) {
    for (const r of riwayat) {
      if (r.status === 'pending' && r.kategori_id && !paidKategoriIds.includes(r.kategori_id)) {
        pendingKategoriIds.add(r.kategori_id)
      }
    }
  }

  const sortedKat = orderedColumns
  const nextKat = sortedKat.find(k => {
    const item = aggregatedItems.find(i => i.kategori_id === k.id)
    return item ? item.dibayar < item.biaya : true
  }) || null

  const progressPercent = totalBiaya > 0 ? Math.min(100, Math.round((totalDibayar / totalBiaya) * 100)) : 0

  function openModal() {
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
      const item = aggregatedItems.find(i => i.kategori_id === k.id)
      const biaya = item?.biaya || 0
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
    if (!jumlah || Number(jumlah) <= 0) {
      setError('Masukkan jumlah pembayaran')
      return
    }
    if (!bankPengirim) {
      setError('Pilih bank / e-wallet pengirim')
      return
    }
    if (!namaPengirim) {
      setError('Masukkan nama pengirim')
      return
    }
    if (!bukti) {
      setError('Upload bukti pembayaran')
      return
    }
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
      api.get(`/pembayaran-item/${pendaftar.id}`).then(r => {
        setKategoriItems(r.data.items || [])
      }).catch(() => {})
      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Terkirim!',
        text: 'Bukti pembayaran Anda telah dikirim dan menunggu verifikasi.',
        confirmButtonColor: '#0D1F3C',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] px-4 py-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">
        
        {/* 1. HEADER */}
        <div className={`${fbCardClass} p-4 sm:p-5`}>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Wallet size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Keuangan Anda</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">Kelola dan pantau pembayaran pendaftaran</p>
            </div>
          </div>
        </div>

        {pendaftar ? (
          <>
            {/* 2. PROGRESS BAR + STATUS */}
            <div className={`${fbCardClass} overflow-hidden`}>
              
              {/* Status + Progress */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-gray-900">Status Akun</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      pendaftar.status_pembayaran === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pendaftar.status_pembayaran === 'verified' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      {pendaftar.status_pembayaran === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-emerald-600">{progressPercent}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-gray-400">Rp {totalDibayar.toLocaleString('id-ID')} dibayar</span>
                  <span className="text-[11px] text-gray-400">Rp {totalBiaya.toLocaleString('id-ID')} total</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Tahapan Pembayaran */}
              {sortedKat.length > 0 && (
                <div className="p-4 sm:p-5">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-3">Tahapan Pembayaran</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 scrollbar-none">
                    {sortedKat.map((k, idx) => {
                      const item = aggregatedItems.find(i => i.kategori_id === k.id)
                      const isLunas = paidKategoriIds.includes(k.id)
                      const isPartial = partialKategoriIds.includes(k.id) || pendingKategoriIds.has(k.id)
                      const isNext = k.id === nextKat?.id
                      const katBiaya = item?.biaya || 0
                      const katDibayar = item?.dibayar || 0
                      
                      return (
                        <div key={k.id} className={`snap-start flex-none w-[130px] sm:w-[140px] flex flex-col p-3 rounded-xl border transition-all ${
                          isLunas ? 'border-emerald-200 bg-emerald-50/60' 
                          : isPartial ? 'border-blue-200 bg-blue-50/60' 
                          : isNext ? 'border-gray-200 bg-white shadow-sm ring-1 ring-gray-100' 
                          : 'border-gray-100 bg-gray-50/50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              isLunas ? 'bg-emerald-500 text-white' 
                              : isPartial ? 'bg-blue-500 text-white' 
                              : isNext ? 'bg-gray-200 text-gray-700' 
                              : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isLunas ? <CheckCircle size={14} /> : isPartial ? <Clock size={13} /> : idx + 1}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isLunas ? 'text-emerald-600 bg-emerald-100'
                              : isPartial ? 'text-blue-600 bg-blue-100'
                              : 'text-gray-400 bg-gray-100'
                            }`}>
                              {isLunas ? 'LUNAS' : isPartial ? 'PROSES' : 'BELUM'}
                            </span>
                          </div>
                          <p className={`text-[12px] font-bold leading-tight line-clamp-1 ${
                            isLunas ? 'text-emerald-700' : isPartial ? 'text-blue-700' : isNext ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {k.nama}
                          </p>
                          {katBiaya > 0 && (
                            <div className="mt-1.5">
                              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                                <span>{katDibayar > 0 ? `Rp ${katDibayar.toLocaleString('id-ID')}` : '-'}</span>
                                <span>Rp {katBiaya.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isLunas ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                  style={{ width: `${katBiaya > 0 ? Math.min(100, (katDibayar / katBiaya) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Ringkasan Biaya */}
              <div className="p-4 sm:p-5">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">Ringkasan Biaya</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {pendaftar.product && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500">Program</span>
                      <span className="text-[13px] font-bold text-gray-900">{pendaftar.product.nama}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-500">Total Biaya</span>
                    <span className="text-[13px] font-semibold text-gray-900">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                  </div>
                  {diskon > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500">Diskon</span>
                      <span className="text-[13px] font-semibold text-emerald-600">- Rp {diskon.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-900">Total Dibayar</span>
                    <span className="text-[14px] font-bold text-emerald-600">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Tunggakan + Bayar */}
                {tunggakan > 0 ? (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                          <AlertCircle size={16} className="text-amber-600" />
                        </div>
                        <span className="text-[13px] font-semibold text-amber-800">Sisa Tunggakan</span>
                      </div>
                      <span className="text-xl font-bold text-amber-900">Rp {tunggakan.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                      onClick={openModal}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Wallet size={18} />
                      Bayar Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200/60 text-center">
                    <CheckCircle size={28} className="mx-auto text-emerald-500 mb-1.5" />
                    <p className="text-[14px] font-bold text-emerald-700">Pembayaran Lunas</p>
                    <p className="text-[12px] text-emerald-600 mt-0.5">Semua tagihan sudah terbayar</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. AKTIVITAS PEMBAYARAN */}
            {riwayat.length > 0 && (
              <div className={`${fbCardClass} overflow-hidden`}>
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100">
                  <h2 className="text-[15px] font-bold text-gray-900">Aktivitas Pembayaran</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {riwayat.map((r, i) => (
                    <div key={r.id} className="px-4 sm:px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          r.status === 'verified' ? 'bg-emerald-100 text-emerald-600'
                          : r.status === 'ditolak' ? 'bg-red-100 text-red-500'
                          : 'bg-amber-100 text-amber-600'
                        }`}>
                          {r.status === 'verified' ? <CheckCircle size={18} /> : r.status === 'ditolak' ? <X size={18} /> : <Clock size={18} />}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-gray-900 truncate">
                                {r.kategori?.nama || 'Pembayaran'}
                              </p>
                              <p className="text-[12px] text-gray-500 mt-0.5">
                                {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pukul {new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[14px] font-bold text-gray-900">Rp {Number(r.jumlah).toLocaleString('id-ID')}</p>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${
                                r.status === 'verified' ? 'text-emerald-600' : r.status === 'ditolak' ? 'text-red-500' : 'text-amber-600'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${
                                  r.status === 'verified' ? 'bg-emerald-500' : r.status === 'ditolak' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {r.status === 'verified' ? 'Selesai' : r.status === 'ditolak' ? 'Ditolak' : 'Diproses'}
                              </span>
                            </div>
                          </div>
                          {r.bukti_pembayaran && (
                            <a
                              href={`http://localhost:8000/storage/${r.bukti_pembayaran}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <FileText size={13} />
                              Lihat Bukti
                              <ChevronRight size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MODAL BAYAR */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4" onClick={() => setShowModal(false)}>
                <div className="w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  {/* Mobile handle */}
                  <div className="flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                  </div>
                  
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Bayar Tunggakan</h2>
                      <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleBayar} className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Program</span>
                          <span className="font-semibold text-gray-900">{pendaftar.product?.nama}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Dibayar</span>
                          <span className="font-semibold text-gray-900">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                          <span className="text-gray-700 font-bold">Tunggakan</span>
                          <span className="font-bold text-amber-700">Rp {tunggakan.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Pembayaran</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={jumlahDisplay}
                          onChange={handleJumlahInput}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder={`Maksimal Rp ${tunggakan.toLocaleString('id-ID')}`}
                        />
                      </div>

                      {distribusiPreview.length > 0 && (
                        <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Distribusi Pembayaran</p>
                          {distribusiPreview.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {d.lunas ? (
                                  <CheckCircle size={13} className="text-emerald-500" />
                                ) : (
                                  <Clock size={13} className="text-amber-500" />
                                )}
                                <span className={`${d.lunas ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>{d.nama}</span>
                              </div>
                              <span className={`font-semibold ${d.lunas ? 'text-emerald-700' : 'text-gray-700'}`}>
                                Rp {d.bayar.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank / E-Wallet Pengirim <span className="text-red-500">*</span></label>
                        <select required value={bankPengirim} onChange={e => setBankPengirim(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                        <input type="text" required value={namaPengirim} onChange={e => setNamaPengirim(e.target.value)}
                          placeholder="Nama di rekening"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Bukti Pembayaran</label>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-white hover:border-emerald-400 transition-all">
                          {bukti ? (
                            <div className="flex flex-col items-center">
                              <Upload className="w-6 h-6 text-emerald-500" />
                              <p className="text-xs text-gray-600 mt-1 font-medium">{bukti.name}</p>
                              <p className="text-[10px] text-gray-400">Klik untuk ganti</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="w-6 h-6 text-gray-400" />
                              <p className="text-xs text-gray-500 mt-1 font-medium">Klik untuk upload</p>
                              <p className="text-[10px] text-gray-400">.JPG, .PNG, atau .PDF</p>
                            </div>
                          )}
                          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setBukti(e.target.files?.[0] || null)} />
                        </label>
                      </div>

                      <div className="flex gap-3 pt-2 pb-2 sm:pb-0">
                        <button type="button" onClick={() => setShowModal(false)}
                          className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
                        <button type="submit" disabled={submitting}
                          className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2">
                          {submitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`${fbCardClass} p-8 text-center`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <CreditCard size={28} />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">Belum ada data pembayaran</p>
          </div>
        )}
      </div>
    </div>
  )
}
