import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, Upload, X, Eye } from 'lucide-react'
import api from '../../services/api'

const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm"

interface Kategori {
  id: number
  kode: string
  nama: string
  urutan: number
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
  const [selectedKatId, setSelectedKatId] = useState<number | null>(null)
  const [jumlah, setJumlah] = useState('')
  const [bukti, setBukti] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function loadData() {
    setLoading(true)
    Promise.all([
      api.get('/siswa-dashboard'),
      api.get('/biaya-kategori'),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const paymentColor: Record<string, string> = {
    unpaid: 'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
  }

  const PaymentIcon = pendaftar?.status_pembayaran === 'verified' ? CheckCircle : Clock

  const diskon = Number(pendaftar?.diskon || 0)
  const dibayar = Number(pendaftar?.nominal || 0)
  const totalBiaya = kategoriItems.reduce((s, i) => s + i.biaya, 0)
  const totalDibayar = kategoriItems.reduce((s, i) => s + i.dibayar, 0)
  const tunggakan = totalBiaya - totalDibayar
  const paidKategoriIds = kategoriItems.filter(i => i.dibayar >= i.biaya && i.biaya > 0).map(i => i.kategori_id)
  const partialKategoriIds = kategoriItems.filter(i => i.dibayar > 0 && i.dibayar < i.biaya).map(i => i.kategori_id)

  const sortedKat = [...kategoris].sort((a, b) => a.urutan - b.urutan)
  const nextKat = sortedKat.find(k => {
    const item = kategoriItems.find(i => i.kategori_id === k.id)
    return item ? item.dibayar < item.biaya : true
  }) || null

  function openModal() {
    setSelectedKatId(nextKat?.id || null)
    const nextItem = kategoriItems.find(i => i.kategori_id === nextKat?.id)
    setJumlah(String(nextItem?.biaya || totalBiaya))
    setBukti(null)
    setError('')
    setShowModal(true)
  }

  function selectKat(id: number) {
    setSelectedKatId(id)
    const item = kategoriItems.find(i => i.kategori_id === id)
    const sisa = (item?.biaya || 0) - (item?.dibayar || 0)
    setJumlah(String(sisa > 0 ? sisa : item?.biaya || 0))
    setError('')
  }

  async function handleBayar(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedKatId) {
      setError('Pilih kategori pembayaran')
      return
    }
    if (!jumlah || Number(jumlah) <= 0) {
      setError('Masukkan jumlah pembayaran')
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
      fd.append('kategori_id', String(selectedKatId))
      fd.append('bukti_pembayaran', bukti)
      const res = await api.post(`/pendaftar/${pendaftar.id}/bayar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPendaftar(res.data.pendaftar)
      setShowModal(false)
      setJumlah('')
      setBukti(null)
      api.get(`/pendaftar/${pendaftar.id}/riwayat-pembayaran`).then(r => setRiwayat(r.data)).catch(() => {})
      api.get(`/pembayaran-item/${pendaftar.id}`).then(r => {
        setKategoriItems(r.data.items || [])
      }).catch(() => {})
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-3 py-4 sm:px-6 sm:py-5">
      <div className={`mb-4 ${cardClass} p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef1f6]">
            <CreditCard size={22} className="text-[#0D1F3C]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pembayaran</h1>
            <p className="text-sm text-gray-500">Informasi pembayaran pendaftaran Anda</p>
          </div>
        </div>
      </div>

      {pendaftar ? (
        <>
          <div className={`${cardClass}`}>
            {/* Status */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Status Pembayaran</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  pendaftar.status_pembayaran === 'verified' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    pendaftar.status_pembayaran === 'verified' ? 'bg-gray-700' : 'bg-gray-400'
                  }`} />
                  {pendaftar.status_pembayaran === 'verified' ? 'Terverifikasi' : 'Menunggu'}
                </span>
              </div>
            </div>

            {/* Tahapan */}
            {kategoris.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tahapan Pembayaran</h3>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
                  {sortedKat.map((k, idx) => {
                    const item = kategoriItems.find(i => i.kategori_id === k.id)
                    const isLunas = paidKategoriIds.includes(k.id)
                    const isPartial = partialKategoriIds.includes(k.id)
                    const isNext = k.id === nextKat?.id
                    const katBiaya = item?.biaya || 0
                    const katDibayar = item?.dibayar || 0
                    return (
                      <div key={k.id} className={`snap-start flex-none w-24 sm:w-28 flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border transition-all ${
                        isLunas
                          ? 'border-gray-200 bg-white'
                          : isPartial
                            ? 'border-gray-300 bg-gray-50'
                            : isNext
                              ? 'border-gray-300 bg-gray-50'
                              : 'border-gray-100 bg-white opacity-40'
                      }`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          isLunas
                            ? 'border-gray-200 bg-white'
                            : isPartial
                              ? 'border-gray-800 text-gray-800'
                              : isNext
                                ? 'border-gray-400 text-gray-400'
                                : 'border-gray-200 text-gray-300'
                        }`}>
                          {isLunas ? <CheckCircle size={14} className="text-emerald-500" /> : isPartial ? <Clock size={12} className="text-gray-800" /> : idx + 1}
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${
                          isLunas ? 'text-gray-900' : isPartial ? 'text-gray-700' : isNext ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                          {k.nama}
                        </p>
                        {katBiaya > 0 && (
                          <p className={`text-[7px] sm:text-[9px] font-medium ${
                            isLunas ? 'text-gray-500' : isPartial ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            Rp {katBiaya.toLocaleString('id-ID')}
                          </p>
                        )}
                        {isLunas && (
                          <span className="text-[7px] sm:text-[9px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-full">Lunas</span>
                        )}
                        {isPartial && (
                          <span className="text-[7px] sm:text-[9px] font-semibold text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full">Belum Lunas</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ringkasan */}
            <div className="px-5 py-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pembayaran</h3>
              <div className="space-y-2.5">
                {pendaftar.product && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Program</span>
                    <span className="text-sm font-medium text-gray-900">{pendaftar.product.nama}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Biaya</span>
                  <span className="text-sm font-medium text-gray-900">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                </div>
                {diskon > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Diskon</span>
                    <span className="text-sm font-medium text-gray-700">- Rp {diskon.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total Dibayar</span>
                  <span className="text-sm font-bold text-gray-900">Rp {totalDibayar.toLocaleString('id-ID')}</span>
                </div>
                {tunggakan > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Tunggakan</span>
                      <span className="text-sm font-bold text-gray-800">Rp {tunggakan.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                      onClick={openModal}
                      className="mt-2 w-full md:w-auto md:px-6 flex items-center justify-center gap-2 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a2d4a] transition-colors"
                    >
                      <CreditCard size={16} /> Bayar Tunggakan
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Riwayat Pembayaran */}
          {riwayat.length > 0 && (
            <div className={`mt-4 ${cardClass}`}>
              <div className="border-b border-gray-200 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-gray-800">
                  Riwayat Pembayaran ({riwayat.length}x)
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {riwayat.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f6]">
                        <CreditCard size={14} className="text-[#0D1F3C]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {r.kategori?.nama || 'Pembayaran ke-' + (riwayat.length - i)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">Rp {Number(r.jumlah).toLocaleString('id-ID')}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'ditolak' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                      <a
                        href={`http://localhost:8000/storage/${r.bukti_pembayaran}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
              <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Bayar Tunggakan</h2>
                  <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
                )}

                <form onSubmit={handleBayar} className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kategori Pembayaran</label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
                      {sortedKat.map(k => {
                        const item = kategoriItems.find(i => i.kategori_id === k.id)
                        const isLunas = paidKategoriIds.includes(k.id)
                        const isPartial = partialKategoriIds.includes(k.id)
                        const isSelectable = (isPartial || (k.id === nextKat?.id && !isLunas)) && !isLunas
                        const isSelected = selectedKatId === k.id
                        const katBiaya = item?.biaya || 0
                        const katDibayar = item?.dibayar || 0
                        return (
                          <button
                            key={k.id}
                            type="button"
                            disabled={!isSelectable}
                            onClick={() => selectKat(k.id)}
                            className={`snap-start flex-none w-20 sm:w-24 flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl border transition-all ${
                              isLunas
                                ? 'border-gray-200 bg-gray-50 cursor-default'
                                : isSelected
                                  ? 'border-gray-800 bg-gray-100 ring-2 ring-gray-300'
                                  : isSelectable
                                    ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                                    : 'border-gray-100 bg-white cursor-default opacity-40'
                            }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                              isLunas ? 'border-emerald-500 text-emerald-500' : isSelectable ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-400'
                            }`}>
                              {isLunas ? <CheckCircle size={11} /> : isPartial ? <Clock size={10} /> : k.urutan}
                            </div>
                            <p className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight ${
                              isLunas ? 'text-gray-500' : isSelected ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {k.nama}
                            </p>
                            {katBiaya > 0 && (
                              <p className={`text-[7px] sm:text-[8px] font-semibold ${isLunas ? 'text-gray-400' : 'text-gray-600'}`}>
                                Rp {katBiaya.toLocaleString('id-ID')}
                              </p>
                            )}
                            {isLunas && <span className="text-[7px] font-semibold text-gray-600 bg-gray-200 px-1 py-0.5 rounded-full">Lunas</span>}
                            {isPartial && <span className="text-[7px] font-semibold text-gray-600 bg-gray-200 px-1 py-0.5 rounded-full">Sisa Rp {(katBiaya - katDibayar).toLocaleString('id-ID')}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Info Step yang Dipilih */}
                  {selectedKatId && (() => {
                    const selectedKat = sortedKat.find(k => k.id === selectedKatId)
                    const selectedItem = kategoriItems.find(i => i.kategori_id === selectedKatId)
                    if (!selectedKat) return null
                    const sisaBayar = (selectedItem?.biaya || 0) - (selectedItem?.dibayar || 0)
                    return (
                      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-gray-800 text-gray-800 bg-white">
                            {selectedKat.urutan}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{selectedKat.nama}</p>
                            <p className="text-xs text-gray-500">Tahap {selectedKat.urutan} dari {sortedKat.length}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-50 rounded-md px-3 py-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Biaya</p>
                            <p className="text-sm font-bold text-gray-900">Rp {(selectedItem?.biaya || 0).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-gray-50 rounded-md px-3 py-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Dibayar</p>
                            <p className="text-sm font-bold text-gray-900">Rp {(selectedItem?.dibayar || 0).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-gray-50 rounded-md px-3 py-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Sisa Bayar</p>
                            <p className="text-sm font-bold text-gray-900">Rp {sisaBayar.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

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
                      type="number"
                      required
                      min={1}
                      max={tunggakan}
                      value={jumlah}
                      onChange={e => setJumlah(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                      placeholder="Masukkan jumlah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti Pembayaran</label>
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-white hover:border-[#0D1F3C] transition-colors">
                      {bukti ? (
                        <div className="flex flex-col items-center">
                          <Upload className="w-6 h-6 text-[#0D1F3C]" />
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
                    <button type="submit" disabled={submitting || !selectedKatId}
                      className="px-8 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a2d4a] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                      {submitting ? <><span className="animate-spin">&#9696;</span> Mengirim</> : 'Kirim Pembayaran'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <CreditCard size={28} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">Belum ada data pembayaran</p>
        </div>
      )}
    </div>
  )
}
