import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import api, { pendaftarApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: 'Pending', disetujui: 'Disetujui', ditolak: 'Ditolak',
    unpaid: 'Belum Bayar', processing: 'Proses', verified: 'Terverifikasi',
  }
  return map[s] || s
}

export default function PendaftarDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pendaftar, setPendaftar] = useState<any>(null)
  const [detail, setDetail] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      pendaftarApi.show(Number(id)),
      pendaftarApi.riwayatPembayaran(Number(id)),
      api.get(`/pembayaran-item/${id}`).catch(() => ({ data: { items: [] } })),
    ]).then(([pendaftarRes, riwayatRes, itemRes]) => {
      setPendaftar(pendaftarRes.data)
      setRiwayat(riwayatRes.data || [])
      setDetail(itemRes.data?.items || itemRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-100 rounded-lg" />
          <div className="h-32 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!pendaftar) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Pendaftar tidak ditemukan</p>
        <button onClick={() => navigate('/pendaftar')} className="mt-4 text-sm text-[#0E6187] hover:underline">Kembali ke daftar</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/pendaftar')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{pendaftar.nama}</h1>
          <p className="text-sm text-gray-500">{pendaftar.email} · {pendaftar.no_registrasi || '-'}</p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${pendaftar.status_pendaftaran === 'disetujui' ? 'bg-green-50 text-green-700 border-green-200' : pendaftar.status_pendaftaran === 'ditolak' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {statusBadge(pendaftar.status_pendaftaran)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${pendaftar.status_pembayaran === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : pendaftar.status_pembayaran === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {statusBadge(pendaftar.status_pembayaran)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Data Diri</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Telepon</span><span className="font-medium">{pendaftar.telepon || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Alamat</span><span className="font-medium text-right max-w-[60%]">{pendaftar.alamat || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tanggal Daftar</span><span className="font-medium">{new Date(pendaftar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Program</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Program</span><span className="font-medium">{pendaftar.product?.nama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Batch</span><span className="font-medium">{pendaftar.batch?.nama_batch || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Diskon</span><span className="font-medium">{pendaftar.diskon ? `Rp ${fmt(pendaftar.diskon)}` : '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Tagihan per-kategori */}
      {detail.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tagihan per Kategori</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left px-4 py-2.5 font-medium">Kategori</th>
                  <th className="text-right px-4 py-2.5 font-medium">Biaya</th>
                  <th className="text-right px-4 py-2.5 font-medium">Dibayar</th>
                  <th className="text-right px-4 py-2.5 font-medium">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((d: any) => {
                  const biaya = Number(d.biaya || d.harga || 0)
                  const dibayar = Number(d.dibayar || d.jumlah || 0)
                  const sisa = Math.max(0, biaya - dibayar)
                  return (
                    <tr key={d.kategori_id || d.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{d.nama || d.kategori?.nama || '-'}</td>
                      <td className="px-4 py-2.5 text-right">{biaya > 0 ? `Rp ${fmt(biaya)}` : '-'}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{dibayar > 0 ? `Rp ${fmt(dibayar)}` : '-'}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${sisa > 0 ? 'text-red-500' : 'text-green-500'}`}>{sisa > 0 ? `Rp ${fmt(sisa)}` : 'Lunas'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Riwayat Pembayaran */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Riwayat Pembayaran</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="text-left px-4 py-2.5 font-medium">Kategori</th>
                  <th className="text-right px-4 py-2.5 font-medium">Jumlah</th>
                  <th className="text-center px-4 py-2.5 font-medium">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium">Bukti</th>
                  <th className="text-right px-4 py-2.5 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">{r.kategori?.nama || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">Rp {fmt(Number(r.jumlah))}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.status === 'verified' ? 'text-green-600' : r.status === 'pending' ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {r.status === 'verified' ? <CheckCircle size={14} /> : null}
                        {statusBadge(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.bukti_pembayaran ? (
                        <a href={`${APP_URL}/storage/${r.bukti_pembayaran}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0E6187] hover:underline">
                          <FileText size={14} /> Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ubah Status */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="px-4 py-3 border-b">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ubah Status</h3>
        </div>
        <div className="p-4">
          <select
            value=""
            onChange={async (e) => {
              const val = e.target.value
              if (!val) return
              const statusMap: Record<string, Record<string, string>> = {
                waiting_payment: { status_pembayaran: 'unpaid', status_pendaftaran: 'pending' },
                confirmed: { status_pembayaran: 'processing', status_pendaftaran: 'pending' },
                proses: { status_pembayaran: 'processing', status_pendaftaran: 'disetujui' },
                selesai: { status_pembayaran: 'verified', status_pendaftaran: 'disetujui' },
                batal: { status_pembayaran: 'ditolak', status_pendaftaran: 'ditolak' },
                refund: { status_pembayaran: 'refund', status_pendaftaran: 'ditolak' },
              }
              const confirmMessages: Record<string, { icon: any; title: string; text: string; confirmText: string }> = {
                waiting_payment: { icon: 'question', title: 'Atur ke Menunggu Pembayaran?', text: 'Status pendaftar akan diubah menjadi menunggu pembayaran.', confirmText: 'Ya, Atur' },
                confirmed: { icon: 'question', title: 'Konfirmasi Pembayaran?', text: 'Pembayaran akan dikonfirmasi. Status diubah menjadi processing.', confirmText: 'Ya, Konfirmasi' },
                proses: { icon: 'question', title: 'Proses Pendaftar?', text: 'Pendaftar akan diproses. Status pendaftaran disetujui.', confirmText: 'Ya, Proses' },
                selesai: { icon: 'question', title: 'Selesaikan?', text: 'Pendaftar akan ditandai selesai (lunas).', confirmText: 'Ya, Selesai' },
                batal: { icon: 'warning', title: 'Batalkan Pendaftar?', text: 'Pendaftar akan dibatalkan. Tindakan ini dapat dibatalkan.', confirmText: 'Ya, Batalkan' },
                refund: { icon: 'warning', title: 'Refund?', text: 'Status diubah menjadi refund.', confirmText: 'Ya, Refund' },
              }
              const target = statusMap[val]
              if (!target) return
              e.target.value = ''
              const msg = confirmMessages[val]
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
              try {
                await pendaftarApi.updateStatus(Number(id), target)
                setPendaftar((prev: any) => prev ? { ...prev, ...target } : prev)
                Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1200, showConfirmButton: false })
              } catch {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' })
              }
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none"
          >
            <option value="">-- Pilih Status --</option>
            <option value="waiting_payment">Menunggu Pembayaran</option>
            <option value="confirmed">Pembayaran dikonfirmasi</option>
            <option value="proses">Proses</option>
            <option value="selesai">Selesai</option>
            <option value="batal">Batal</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/pendaftar/${id}/invoice`)} className="flex items-center gap-1.5 px-4 py-2 bg-[#0E6187] text-white text-sm font-medium rounded-lg hover:bg-[#0d5475]">
          <FileText size={16} /> Lihat Invoice
        </button>
        <button
          onClick={async () => {
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
            try {
              await pendaftarApi.destroy(Number(id))
              Swal.fire({ icon: 'success', title: 'Pendaftar dihapus', timer: 1500, showConfirmButton: false })
              navigate('/pendaftar')
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus pendaftar' })
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100"
        >
          <Trash2 size={16} /> Hapus Pendaftar
        </button>
      </div>
    </div>
  )
}
