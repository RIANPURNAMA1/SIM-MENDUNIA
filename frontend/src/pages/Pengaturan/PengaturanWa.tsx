import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle2, XCircle, Phone, CreditCard } from 'lucide-react'
import { pengaturanWaApi } from '../../services/api'

interface WaSetting {
  id: number
  key: string
  is_enabled: boolean
  description: string
  value: string | null
}

const statusColors: Record<string, string> = {
  wa_hadir: 'bg-emerald-100 text-emerald-700',
  wa_terlambat: 'bg-red-100 text-red-700',
  wa_pulang_lebih_awal: 'bg-amber-100 text-amber-700',
  wa_tidak_absen_pulang: 'bg-red-100 text-red-700',
  wa_alpa: 'bg-rose-100 text-rose-700',
  wa_reminder_belum_absen: 'bg-blue-100 text-blue-700',
  wa_pembayaran: 'bg-yellow-100 text-yellow-700',
  wa_pembayaran_admin_phones: 'bg-purple-100 text-purple-700',
}

export default function PengaturanWaPage() {
  const [settings, setSettings] = useState<WaSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    pengaturanWaApi.get()
      .then((res) => setSettings(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, is_enabled: !s.is_enabled } : s))
    )
  }

  const updateValue = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    try {
      const payload: Record<string, { is_enabled: boolean; value?: string | null }> = {}
      settings.forEach((s) => {
        payload[s.key] = {
          is_enabled: s.is_enabled,
          value: s.value,
        }
      })
      await pengaturanWaApi.update({ settings: payload })
      setSuccess('Pengaturan notifikasi berhasil diperbarui.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const formatLabel = (key: string) => {
    return key
      .replace('wa_', '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const absensiSettings = settings.filter((s) => !s.key.startsWith('wa_pembayaran'))
  const paymentSettings = settings.filter((s) => s.key === 'wa_pembayaran')
  const adminPhoneSettings = settings.filter((s) => s.key === 'wa_pembayaran_admin_phones')

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
          <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Pengaturan Notifikasi WhatsApp</h1>
          <p className="text-sm text-slate-500">Kelola notifikasi WhatsApp untuk absensi & pembayaran</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Absensi Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MessageCircle size={16} />
            Notifikasi Absensi
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Jenis Notifikasi</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Deskripsi</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600 w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {absensiSettings.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[s.key] || 'bg-slate-100 text-slate-600'}`}>
                        {formatLabel(s.key)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.description}</td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggle(s.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        s.is_enabled
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {s.is_enabled ? (
                        <><CheckCircle2 size={14} />AKTIF</>
                      ) : (
                        <><XCircle size={14} />NONAKTIF</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <CreditCard size={16} />
            Notifikasi Pembayaran
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {paymentSettings.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[s.key] || 'bg-slate-100 text-slate-600'}`}>
                  {formatLabel(s.key)}
                </span>
                <p className="text-sm text-slate-500 mt-1">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  s.is_enabled
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s.is_enabled ? (
                  <><CheckCircle2 size={14} />AKTIF</>
                ) : (
                  <><XCircle size={14} />NONAKTIF</>
                )}
              </button>
            </div>
          ))}

          {/* Admin Phone Numbers */}
          {adminPhoneSettings.map((s) => (
            <div key={s.id} className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={14} className="text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Nomor HP Admin (Penerima Notifikasi Pembayaran)</label>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Pisahkan dengan koma untuk beberapa nomor. Contoh: 081234567890,085678901234
              </p>
              <input
                type="text"
                value={s.value || ''}
                onChange={(e) => updateValue(s.key, e.target.value)}
                placeholder="081234567890,085678901234"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0D1F3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a3054] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}
