import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, Loader, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import { pendaftarApi } from '../../services/api'

interface InvoiceData {
  no_invoice: string
  pendaftar: {
    id: number
    nama: string
    email: string
    telepon: string | null
    alamat: string | null
    created_at: string
    status_pendaftaran: string
    status_pembayaran: string
  }
  product: {
    id: number
    nama: string
    harga: number
  } | null
  coupon: {
    kode: string
    diskon: number
  } | null
  keuangan: {
    harga_produk: number
    diskon: number
    total_tagihan: number
    total_dibayar: number
    sisa: number
  }
  riwayat_pembayaran: Array<{
    id: number
    jumlah: number
    status: string
    created_at: string
    bukti_pembayaran: string | null
  }>
}

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending' },
    disetujui: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Disetujui' },
    ditolak: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'Ditolak' },
    unpaid: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'Belum Bayar' },
    processing: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Proses' },
    verified: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Terverifikasi' },
  }
  const s = map[status] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'verified' || status === 'disetujui' ? 'bg-emerald-500' : status === 'ditolak' ? 'bg-red-500' : 'bg-amber-500'}`} />
      {s.label}
    </span>
  )
}

export default function InvoicePendaftar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!id) return
    pendaftarApi.invoice(Number(id))
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      pdf.save(`Invoice-${data?.no_invoice || id}.pdf`)
    } catch (err) {
      console.error('PDF generation failed', err)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <Loader size={20} className="animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Memuat invoice...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <FileText size={28} />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">Data invoice tidak ditemukan</p>
        <button onClick={() => navigate('/pendaftar')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Kembali ke Pendaftar
        </button>
      </div>
    )
  }

  const { pendaftar, product, keuangan, riwayat_pembayaran, no_invoice } = data
  const tgl = new Date(pendaftar.created_at)
  const formattedDate = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-5">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/pendaftar')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Printer size={16} />
            Cetak
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D1F3C] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a2d4a] disabled:opacity-60"
          >
            {downloading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Menyiapkan...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div ref={invoiceRef} className="mx-auto max-w-[210mm] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <div className="relative border-b border-slate-200 px-8 pb-6 pt-8 sm:px-12" style={{ borderBottom: '2px solid #0D1F3C' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0D1F3C] p-2">
                <img src="/logo-sm.png" alt="SIM Mendunia" className="h-full w-full object-contain brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0D1F3C]">SIM MENDUNIA</h1>
                <p className="text-xs text-slate-500">Sistem Informasi Manajemen</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-bold tracking-wide text-[#0D1F3C]">INVOICE</h2>
              <p className="mt-1 text-xs text-slate-500 font-mono">{no_invoice}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
            <p>Jl. Contoh No. 123, Jakarta</p>
            <p>Email: info@simmendunia.com | Telp: (021) 1234-5678</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 sm:px-12">
          {/* Bill To & Info */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Bill To</h3>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">{pendaftar.nama}</p>
                <p className="mt-1 text-xs text-slate-500">{pendaftar.email}</p>
                {pendaftar.telepon && <p className="text-xs text-slate-500">{pendaftar.telepon}</p>}
                {pendaftar.alamat && <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs">{pendaftar.alamat}</p>}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Detail Invoice</h3>
              <div className="inline-block rounded-lg bg-slate-50 p-4 text-left">
                <div className="flex justify-between gap-8 text-xs">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-semibold text-slate-800">{formattedDate}</span>
                </div>
                <div className="mt-1.5 flex justify-between gap-8 text-xs">
                  <span className="text-slate-500">Status Daftar</span>
                  <span>{statusBadge(pendaftar.status_pendaftaran)}</span>
                </div>
                <div className="mt-1.5 flex justify-between gap-8 text-xs">
                  <span className="text-slate-500">Status Bayar</span>
                  <span>{statusBadge(pendaftar.status_pembayaran)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Item Table */}
          <div className="mb-8 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#0D1F3C] text-white">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Deskripsi</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{product?.nama || 'Program Pendaftaran'}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Biaya pendaftaran program</p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                    Rp {keuangan.harga_produk.toLocaleString('id-ID')}
                  </td>
                </tr>
                {keuangan.diskon > 0 && (
                  <tr className="border-b border-slate-100 bg-white">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-emerald-700">Diskon</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Kupon: {data.coupon?.kode || '-'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                      - Rp {keuangan.diskon.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="mb-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800">Rp {keuangan.harga_produk.toLocaleString('id-ID')}</span>
              </div>
              {keuangan.diskon > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Diskon</span>
                  <span className="font-semibold text-emerald-600">- Rp {keuangan.diskon.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Total Tagihan</span>
                <span className="font-bold text-slate-800">Rp {keuangan.total_tagihan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sudah Dibayar</span>
                <span className="font-semibold text-emerald-700">Rp {keuangan.total_dibayar.toLocaleString('id-ID')}</span>
              </div>
              {keuangan.sisa > 0 ? (
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-red-600">Sisa Tagihan</span>
                  <span className="font-bold text-red-600">Rp {keuangan.sisa.toLocaleString('id-ID')}</span>
                </div>
              ) : (
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-emerald-700">Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle size={14} /> Lunas</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {riwayat_pembayaran.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Riwayat Pembayaran</h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">#</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Jumlah</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat_pembayaran.map((r, i) => (
                      <tr key={r.id} className="border-t border-slate-100 bg-white">
                        <td className="px-4 py-2.5 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-800">
                          Rp {r.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            r.status === 'ditolak' ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {r.status === 'verified' ? <CheckCircle size={10} /> :
                             r.status === 'ditolak' ? <XCircle size={10} /> :
                             <Clock size={10} />}
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 sm:px-12">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div className="text-xs text-slate-400">
              <p className="font-semibold text-slate-600">SIM MENDUNIA</p>
              <p>Invoice ini sah dan diproses secara elektronik</p>
            </div>
            <div className="text-xs text-slate-400">
              <p>Terima kasih telah mendaftar!</p>
              <p className="font-mono text-[10px] text-slate-300">{no_invoice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0; size: A4; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  )
}
