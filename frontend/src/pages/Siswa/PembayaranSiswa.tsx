import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, Upload, X, Eye, FileText, ChevronRight } from 'lucide-react'
import Swal from 'sweetalert2'
import api, { APP_URL } from '../../services/api'

// Class bergaya kartu Facebook
const fbCardClass = "bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.12)]"

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
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
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
    <div className="min-h-screen bg-[#F0F2F5] px-4 py-6 sm:px-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">
        
        {/* HEADER CARD - FB Style */}
        <div className={`${fbCardClass} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <CreditCard size={20} className="text-[#0E6187]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Keuangan Anda</h1>
              <p className="text-[13px] text-gray-500">Kelola dan pantau pembayaran pendaftaran</p>
            </div>
          </div>
        </div>

        {pendaftar ? (
          <>
            {/* MAIN INFO CARD */}
            <div className={`${fbCardClass} overflow-hidden`}>
              
              {/* STATUS BAR */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
                <span className="text-[15px] font-semibold text-gray-900">Status Akun</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  pendaftar.status_pembayaran === 'verified' ? 'bg-[#E7F3EC] text-[#1C7A41]' : 'bg-[#FFF3CD] text-[#856404]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    pendaftar.status_pembayaran === 'verified' ? 'bg-[#1C7A41]' : 'bg-[#856404]'
                  }`} />
                  {pendaftar.status_pembayaran === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                </span>
              </div>

              {/* TAHAPAN PEMBAYARAN */}
              {sortedKat.length > 0 && (
                <div className="px-4 py-4 border-b border-gray-100">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-3">Tahapan Pembayaran</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
                    {sortedKat.map((k, idx) => {
                      const item = aggregatedItems.find(i => i.kategori_id === k.id)
                      const isLunas = paidKategoriIds.includes(k.id)
                      const isPartial = partialKategoriIds.includes(k.id) || pendingKategoriIds.has(k.id)
                      const isNext = k.id === nextKat?.id
                      const katBiaya = item?.biaya || 0
                      
                      return (
                        <div key={k.id} className={`snap-start flex-none w-[110px] flex flex-col p-3 rounded-xl border transition-all ${
                          isLunas ? 'border-[#E7F3EC] bg-[#F7FBF9]' 
                          : isPartial ? 'border-blue-100 bg-blue-50/50' 
                          : isNext ? 'border-gray-200 bg-white shadow-sm' 
                          : 'border-transparent bg-gray-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                            isLunas ? 'bg-[#1C7A41] text-white' 
                            : isPartial ? 'bg-[#0866FF] text-white' 
                            : isNext ? 'bg-gray-200 text-gray-800' 
                            : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isLunas ? <CheckCircle size={16} /> : isPartial ? <Clock size={16} /> : idx + 1}
                          </div>
                          <p className={`text-[12px] font-semibold leading-tight line-clamp-2 ${
                            isLunas ? 'text-[#1C7A41]' : isPartial ? 'text-[#0866FF]' : isNext ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {k.nama}
                          </p>
                          {katBiaya > 0 && (
                            <p className="text-[11px] font-medium text-gray-500 mt-1">
                              Rp {katBiaya.toLocaleString('id-ID')}
                            </p>
                          )}
                          <span className={`mt-1.5 inline-block w-fit text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isLunas ? 'bg-[#E7F3EC] text-[#1C7A41]'
                            : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isLunas ? 'Lunas' : 'Belum'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* RINGKASAN & ACTION */}
              <div className="px-4 py-4 bg-white">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">Ringkasan Biaya</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                  {pendaftar.product && (
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-gray-600">Program</span>
                      <span className="text-[14px] font-semibold text-gray-900">{pendaftar.product.nama}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-gray-600">Total Biaya</span>
                    <span className="text-[14px] font-semibold text-gray-900">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                  </div>
                  {diskon > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-gray-600">Diskon</span>
                      <span className="text-[14px] font-semibold text-green-600">- Rp {diskon.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200/80 pt-3 mt-1 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-gray-900">Total Dibayar</span>
                    <span className="text-[15px] font-bold text-[#1C7A41]">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {tunggakan > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-gray-500">Sisa Tunggakan</p>
                      <p className="text-xl font-bold text-gray-900">Rp {tunggakan.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={openModal}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
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
                  <h2 className="text-[16px] font-bold text-gray-900">Aktivitas Pembayaran</h2>
                </div>
                <div className="flex flex-col">
                  {riwayat.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-900 truncate">
                          {r.kategori?.nama || 'Pembayaran ke-' + (riwayat.length - i)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[12px] text-gray-500">
                            {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`text-[12px] font-semibold ${
                            r.status === 'verified' ? 'text-[#1C7A41]' : r.status === 'ditolak' ? 'text-red-600' : 'text-[#856404]'
                          }`}>
                            {r.status === 'verified' ? 'Selesai' : r.status === 'ditolak' ? 'Ditolak' : 'Diproses'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[15px] font-bold text-gray-900">Rp {Number(r.jumlah).toLocaleString('id-ID')}</span>
                        <a
                          href={`${APP_URL}/storage/${r.bukti_pembayaran}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[12px] font-semibold text-[#0866FF] hover:underline"
                        >
                          Lihat Bukti <ChevronRight size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAYMENT MODAL - KODE ASLI SEPERTI PERMINTAAN */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
                <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Bayar Tunggakan</h2>
                    <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
                  )}

                  <form onSubmit={handleBayar} className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Program</span>
                        <span className="font-semibold text-gray-900">{pendaftar.product?.nama}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Dibayar</span>
                        <span className="font-semibold text-gray-900">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-semibold">Tunggakan</span>
                        <span className="font-bold text-gray-800">Rp {tunggakan.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={jumlahDisplay}
                        onChange={handleJumlahInput}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                        placeholder={`Maksimal Rp ${tunggakan.toLocaleString('id-ID')}`}
                      />
                    </div>

                    {distribusiPreview.length > 0 && (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-2">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Preview Distribusi Pembayaran</p>
                        {distribusiPreview.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {d.lunas ? (
                                <CheckCircle size={14} className="text-emerald-500" />
                              ) : (
                                <Clock size={14} className="text-amber-500" />
                              )}
                              <span className={`${d.lunas ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>{d.nama}</span>
                            </div>
                            <span className={`font-semibold ${d.lunas ? 'text-emerald-700' : 'text-gray-700'}`}>
                              Rp {d.bayar.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                        {Number(jumlah) > distribusiPreview.reduce((s, d) => s + d.bayar, 0) && (
                          <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between text-sm">
                            <span className="text-blue-600">Sisa kembali</span>
                            <span className="font-bold text-blue-700">
                              Rp {(Number(jumlah) - distribusiPreview.reduce((s, d) => s + d.bayar, 0)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank / E-Wallet Pengirim <span className="text-red-500">*</span></label>
                      <select required value={bankPengirim} onChange={e => setBankPengirim(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                      <input type="text" required value={namaPengirim} onChange={e => setNamaPengirim(e.target.value)}
                        placeholder="Nama di rekening"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti Pembayaran</label>
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-white hover:border-[#0E6187] transition-colors">
                        {bukti ? (
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 text-[#0E6187]" />
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

                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
                      <button type="submit" disabled={submitting}
                        className="px-8 py-2.5 bg-[#0E6187] text-white rounded-md text-sm font-semibold hover:bg-[#1a5e6f] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                        {submitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`${fbCardClass} p-10 text-center flex flex-col items-center`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
              <CreditCard size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada data</h3>
            <p className="mt-1 text-[14px] text-gray-500">Data pembayaran pendaftaran belum tersedia.</p>
          </div>
        )}
      </div>
    </div>
  )
}