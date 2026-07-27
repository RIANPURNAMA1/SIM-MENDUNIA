import { useState, useEffect } from 'react'
import { waSettingApi } from '../../services/api'
import {
  Settings,
  Bell,
  BellOff,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
} from 'lucide-react'

interface GlobalSetting {
  key: string
  description: string
  is_enabled: boolean
  value?: string
}

export default function DataNotifikasiSetting() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const globalRes = await waSettingApi.getGlobalSettings()
      setGlobalSettings(globalRes.data)
    } catch {
      setErrorMsg('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const saveGlobal = async () => {
    setSaving(true); setSuccessMsg(''); setErrorMsg('')
    try {
      await waSettingApi.updateGlobalSettings(globalSettings)
      setSuccessMsg('Pengaturan global berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch { setErrorMsg('Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleGlobalToggle = (key: string, value: boolean) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, is_enabled: value } : s))
  }

  const handleGlobalValueChange = (key: string, value: string) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#0E6187]" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0E6187]">Pengaturan Notifikasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola pengiriman notifikasi WhatsApp & Email otomatis
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Global Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center">
              <Settings size={20} className="text-[#0E6187]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0E6187]">Pengaturan Global</h2>
              <p className="text-xs text-slate-500">Aktifkan/nonaktifkan jenis notifikasi</p>
            </div>
          </div>
          <button onClick={saveGlobal} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {globalSettings.map(setting => (
            <div key={setting.key} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {setting.key.includes('email') ? <Mail size={16} className="text-blue-500" /> :
                 setting.is_enabled ? <Bell size={16} className="text-emerald-500" /> : <BellOff size={16} className="text-slate-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-700">{setting.description}</p>
                  <p className="text-xs text-slate-400 font-mono">{setting.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {setting.key === 'wa_pembayaran_admin_phones' && (
                  <input type="text" value={setting.value || ''}
                    onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                    placeholder="628xxxxxxxxxx"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                )}
                {setting.key === 'email_pembayaran_admin_addresses' && (
                  <input type="text" value={setting.value || ''}
                    onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                    placeholder="admin@example.com"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                )}
                {setting.key === 'starsender_api_key' && (
                  <input type="text" value={setting.value || ''}
                    onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                )}
                {setting.key === 'starsender_api_url' && (
                  <input type="text" value={setting.value || ''}
                    onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
                    placeholder="https://api.starsender.online/api/send"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                )}
                {setting.key.startsWith('starsender_') || setting.key === 'wa_pembayaran_admin_phones' || setting.key === 'email_pembayaran_admin_addresses' ? (
                  <span className="w-11" />
                ) : (
                <button onClick={() => handleGlobalToggle(setting.key, !setting.is_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
        <p className="font-medium mb-2">Cara kerja notifikasi otomatis:</p>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          <li>Pengingat dikirim setiap hari jam 09:00 via <code className="bg-blue-100 px-1 rounded">php artisan app:reminder-pembayaran</code></li>
          <li>Email memerlukan konfigurasi SMTP di <code className="bg-blue-100 px-1 rounded">.env</code> (MAIL_MAILER, MAIL_HOST, dll)</li>
          <li>Jika SMTP belum dikonfigurasi, email akan di-log saja (tidak terkirim)</li>
          <li>Pengingat tidak akan dikirim jika kategori sudah lunas</li>
        </ul>
      </div>
    </div>
  )
}
