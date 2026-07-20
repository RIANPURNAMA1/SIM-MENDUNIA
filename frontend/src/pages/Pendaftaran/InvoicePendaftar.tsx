import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, FileText, CheckCircle, Clock, XCircle, ShieldCheck } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { pendaftarApi, companyProfileApi } from '../../services/api'
import type { CompanyProfile } from '../../types'

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
  const map: Record<string, string> = {
    pending: 'Pending',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
    unpaid: 'Belum Bayar',
    processing: 'Proses',
    verified: 'Terverifikasi',
  }
  const label = map[status] || status
  return <span className="font-semibold text-slate-700">{label}</span>
}

export default function InvoicePendaftar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<InvoiceData | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      pendaftarApi.invoice(Number(id)),
      companyProfileApi.get(),
    ])
      .then(([invoiceRes, companyRes]) => {
        setData(invoiceRes.data)
        setCompany(companyRes.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!data?.no_invoice) return
    const verifikasiUrl = `${window.location.origin}/verifikasi/${data.no_invoice}`
    toDataURL(verifikasiUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
    }).then(setQrDataUrl)
  }, [data])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    const el = invoiceRef.current
    if (!el) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const origStyle = el.getAttribute('style') || ''
      const origW = el.style.width
      const origMaxW = el.style.maxWidth
      const origH = el.style.height
      const origOverflow = el.style.overflow

      el.style.width = '210mm'
      el.style.maxWidth = 'none'
      el.style.height = '297mm'
      el.style.overflow = 'hidden'

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      el.style.width = origW
      el.style.maxWidth = origMaxW
      el.style.height = origH
      el.style.overflow = origOverflow
      if (!origStyle) el.removeAttribute('style')

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
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
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
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
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#00C0FF] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#00a8e0] disabled:opacity-60"
          >
            {downloading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Menyiapkan...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div ref={invoiceRef} className="invoice-print mx-auto max-w-[210mm] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <div className="relative border-b border-slate-200 px-8 pb-6 pt-8 sm:px-12" style={{ borderBottom: '2px solid #00C0FF' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <img src={company?.logo_url || '/logo-sm.png'} alt="" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#00C0FF]">{company?.company_name || 'MENDUNIA.ID'}</h1>
                <p className="text-xs text-slate-500">{company?.pt_name || 'PT INDONESIA SUKSES MENDUNIA'}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-bold tracking-wide text-[#00C0FF]">INVOICE</h2>
              <p className="mt-1 text-xs text-slate-500 font-mono">{no_invoice}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
            <p>{company?.address || 'Jl. Contoh No. 123, Jakarta'}</p>
            <p>{company?.email ? `Email: ${company.email}` : ''}{company?.email && company?.phone ? ' | ' : ''}{company?.phone ? `Telp: ${company.phone}` : ''}</p>
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
                <tr className="bg-[#00C0FF] text-white">
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

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 sm:px-12">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-4">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Verifikasi" className="shrink-0 w-[90px] h-[90px]" />}
              <div className="text-xs text-slate-400 text-left">
                <p className="font-semibold text-slate-600">{company?.company_name || 'MENDUNIA.ID'}</p>
                <p>Invoice ini sah dan diproses secara elektronik</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <ShieldCheck size={12} />
                  Scan untuk verifikasi keaslian dokumen
                </p>
              </div>
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
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; }
          @page { margin: 0; size: A4; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; max-width: none; overflow: hidden; display: flex; flex-direction: column; border: none; border-radius: 0; box-shadow: none; }
          .invoice-print > div:first-child { flex-shrink: 0; }
          .invoice-print > div:nth-child(2) { flex: 1; overflow: hidden; }
          .invoice-print > div:last-child { flex-shrink: 0; }
        }
      `}</style>
    </div>
  )
}
