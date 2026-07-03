import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle2, XCircle } from 'lucide-react'
import { pengaturanWaApi } from '../services/api'

interface WaSetting {
  id: number
  key: string
  is_enabled: boolean
  description: string
}

const statusColors: Record<string, string> = {
  wa_hadir: 'bg-emerald-100 text-emerald-700',
  wa_terlambat: 'bg-red-100 text-red-700',
  wa_pulang_lebih_awal: 'bg-amber-100 text-amber-700',
  wa_tidak_absen_pulang: 'bg-red-100 text-red-700',
  wa_alpa: 'bg-rose-100 text-rose-700',
  wa_reminder_belum_absen: 'bg-blue-100 text-blue-700',
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

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    try {
      const payload: Record<string, boolean> = {}
      settings.forEach((s) => { payload[s.key] = s.is_enabled })
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

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-56 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-100 rounded" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
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
          <p className="text-sm text-slate-500">Kelola notifikasi WhatsApp untuk absensi karyawan</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Jenis Notifikasi</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Deskripsi</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600 w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.map((s) => (
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