import { useState, useEffect } from 'react'
import { waSettingApi, aiSettingApi } from '../../services/api'
import {
  Settings,
  Bell,
  BellOff,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Webhook,
  ShieldAlert,
  Globe,
  FlaskConical,
  Bot,
  KeyRound,
  Activity,
} from 'lucide-react'

interface GlobalSetting {
  key: string
  description: string
  is_enabled: boolean
  value?: string
}

interface MailSetting {
  key: string
  description: string
  value?: string
}

type TabId = 'wa' | 'email' | 'website' | 'ai' | 'uji'

type AiProvider = 'groq' | 'gemini' | 'claude' | 'gpt' | 'modelsstudio'

interface AiSettings {
  provider: AiProvider
  groq_api_key?: string
  groq_configured?: boolean
  gemini_api_key?: string
  gemini_configured?: boolean
  claude_api_key?: string
  claude_configured?: boolean
  gpt_api_key?: string
  gpt_configured?: boolean
  modelsstudio_api_key?: string
  modelsstudio_configured?: boolean
  models?: Record<string, string>
  base_urls?: Record<string, string>
}

export default function DataNotifikasiSetting() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([])
  const [mailSettings, setMailSettings] = useState<MailSetting[]>([])
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMail, setSavingMail] = useState(false)
  const [savingAi, setSavingAi] = useState(false)
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [aiProvider, setAiProvider] = useState<AiProvider>('groq')
  const [aiGroqKey, setAiGroqKey] = useState('')
  const [aiGeminiKey, setAiGeminiKey] = useState('')
  const [aiClaudeKey, setAiClaudeKey] = useState('')
  const [aiGptKey, setAiGptKey] = useState('')
  const [aiMsKey, setAiMsKey] = useState('')
  const [aiGroqModel, setAiGroqModel] = useState('')
  const [aiGeminiModel, setAiGeminiModel] = useState('')
  const [aiClaudeModel, setAiClaudeModel] = useState('')
  const [aiGptModel, setAiGptModel] = useState('')
  const [aiMsModel, setAiMsModel] = useState('')
  const [aiMsBaseUrl, setAiMsBaseUrl] = useState('')

  const [activeTab, setActiveTab] = useState<TabId>('wa')

  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; config?: any } | null>(null)

  const [testWaPhone, setTestWaPhone] = useState('')
  const [testingWa, setTestingWa] = useState(false)
  const [testWaResult, setTestWaResult] = useState<{ success: boolean; message: string; config?: any } | null>(null)

  const [testWhScenario, setTestWhScenario] = useState('payment_confirm')
  const [testWhPhone, setTestWhPhone] = useState('')
  const [testWhMessage, setTestWhMessage] = useState('KONFIRMASI')
  const [testWhPayload, setTestWhPayload] = useState('')
  const [testWhUsePayload, setTestWhUsePayload] = useState(false)
  const [testWhExecute, setTestWhExecute] = useState(false)
  const [testingWh, setTestingWh] = useState(false)
  const [testWhResult, setTestWhResult] = useState<any>(null)

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [globalRes, mailRes, aiRes] = await Promise.all([
        waSettingApi.getGlobalSettings(),
        waSettingApi.getMailSettings(),
        aiSettingApi.get().catch(() => null),
      ])
      setGlobalSettings(globalRes.data)
      setMailSettings(mailRes.data)
      if (aiRes) {
        setAiSettings(aiRes.data)
        setAiProvider(aiRes.data.provider)
        setAiGroqModel(aiRes.data.models?.groq || '')
        setAiGeminiModel(aiRes.data.models?.gemini || '')
        setAiClaudeModel(aiRes.data.models?.claude || '')
        setAiGptModel(aiRes.data.models?.gpt || '')
        setAiMsModel(aiRes.data.models?.modelsstudio || '')
        setAiMsBaseUrl(aiRes.data.base_urls?.modelsstudio || '')
      }
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

  const saveMail = async () => {
    setSavingMail(true); setSuccessMsg(''); setErrorMsg('')
    try {
      await waSettingApi.updateMailSettings(mailSettings)
      setSuccessMsg('Konfigurasi email berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch { setErrorMsg('Gagal menyimpan') } finally { setSavingMail(false) }
  }

  const saveAi = async () => {
    setSavingAi(true); setSuccessMsg(''); setErrorMsg(''); setAiTestResult(null)
    try {
      await aiSettingApi.update({
        provider: aiProvider,
        groq_api_key: aiGroqKey.trim(),
        gemini_api_key: aiGeminiKey.trim(),
        claude_api_key: aiClaudeKey.trim(),
        gpt_api_key: aiGptKey.trim(),
        modelsstudio_api_key: aiMsKey.trim(),
        modelsstudio_base_url: aiMsBaseUrl.trim() || undefined,
        groq_model: aiGroqModel.trim() || undefined,
        gemini_model: aiGeminiModel.trim() || undefined,
        claude_model: aiClaudeModel.trim() || undefined,
        gpt_model: aiGptModel.trim() || undefined,
        modelsstudio_model: aiMsModel.trim() || undefined,
      })
      setAiGroqKey('')
      setAiGeminiKey('')
      setAiClaudeKey('')
      setAiGptKey('')
      setAiMsKey('')
      const aiRes = await aiSettingApi.get()
      setAiSettings(aiRes.data)
      setAiGroqModel(aiRes.data.models?.groq || '')
      setAiGeminiModel(aiRes.data.models?.gemini || '')
      setAiClaudeModel(aiRes.data.models?.claude || '')
      setAiGptModel(aiRes.data.models?.gpt || '')
      setAiMsModel(aiRes.data.models?.modelsstudio || '')
      setAiMsBaseUrl(aiRes.data.base_urls?.modelsstudio || '')
      setSuccessMsg('Pengaturan AI Assistant berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch { setErrorMsg('Gagal menyimpan') } finally { setSavingAi(false) }
  }

  const providerModels: Record<AiProvider, string> = {
    groq: aiGroqModel,
    gemini: aiGeminiModel,
    claude: aiClaudeModel,
    gpt: aiGptModel,
    modelsstudio: aiMsModel,
  }

  const getConfigured = (p: AiProvider): boolean | undefined => {
    switch (p) {
      case 'groq': return aiSettings?.groq_configured
      case 'gemini': return aiSettings?.gemini_configured
      case 'claude': return aiSettings?.claude_configured
      case 'gpt': return aiSettings?.gpt_configured
      default: return aiSettings?.modelsstudio_configured
    }
  }

  const getMaskedKey = (p: AiProvider): string | undefined => {
    switch (p) {
      case 'groq': return aiSettings?.groq_api_key
      case 'gemini': return aiSettings?.gemini_api_key
      case 'claude': return aiSettings?.claude_api_key
      case 'gpt': return aiSettings?.gpt_api_key
      default: return aiSettings?.modelsstudio_api_key
    }
  }

  const getAiKey = () => {
    switch (aiProvider) {
      case 'gemini': return aiGeminiKey.trim()
      case 'claude': return aiClaudeKey.trim()
      case 'gpt': return aiGptKey.trim()
      case 'modelsstudio': return aiMsKey.trim()
      default: return aiGroqKey.trim()
    }
  }

  const testAi = async () => {
    setTestingAi(true); setAiTestResult(null)
    try {
      const res = await aiSettingApi.test({ provider: aiProvider, api_key: getAiKey() || undefined })
      setAiTestResult(res.data)
    } catch (err: any) {
      setAiTestResult({ success: false, message: err?.response?.data?.message || 'Gagal uji koneksi' })
    } finally {
      setTestingAi(false)
    }
  }

  const handleGlobalToggle = (key: string, value: boolean) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, is_enabled: value } : s))
  }

  const handleGlobalValueChange = (key: string, value: string) => {
    setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleMailValueChange = (key: string, value: string) => {
    setMailSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleTestEmail = async () => {
    if (!testEmail.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await waSettingApi.testEmail(testEmail.trim())
      setTestResult({ success: true, message: res.data.message, config: res.data.config })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengirim email uji coba'
      setTestResult({ success: false, message: msg, config: err?.response?.data?.config })
    } finally {
      setTesting(false)
    }
  }

  const handleTestWa = async () => {
    if (!testWaPhone.trim()) return
    setTestingWa(true)
    setTestWaResult(null)
    try {
      const res = await waSettingApi.testWa(testWaPhone.trim())
      setTestWaResult({ success: true, message: res.data.message, config: res.data.config })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengirim WhatsApp uji coba'
      setTestWaResult({ success: false, message: msg, config: err?.response?.data?.config })
    } finally {
      setTestingWa(false)
    }
  }

  const adminPhones = (globalSettings.find(s => s.key === 'wa_pembayaran_admin_phones')?.value || '')
    .split(',').map(p => p.trim()).filter(Boolean)

  const handleScenarioChange = (value: string) => {
    setTestWhScenario(value)
    const preset: Record<string, string> = {
      payment_confirm: 'KONFIRMASI',
      payment_cancel: 'BATAL',
      izin_approve: 'IYA',
      unknown: 'HALO',
    }
    setTestWhMessage(preset[value] || '')
    if (value === 'payment_confirm' || value === 'payment_cancel') {
      setTestWhPhone(adminPhones[0] || '')
    } else if (value === 'izin_approve') {
      setTestWhPhone('085773141623')
    } else {
      setTestWhPhone('')
    }
  }

  const handleTestWebhook = async () => {
    setTestingWh(true)
    setTestWhResult(null)
    try {
      const data: any = { execute: testWhExecute }
      if (testWhUsePayload && testWhPayload.trim()) {
        data.payload = testWhPayload.trim()
      } else {
        data.from = testWhPhone.trim()
        data.message = testWhMessage.trim()
      }
      const res = await waSettingApi.testWebhook(data)
      setTestWhResult(res.data)
    } catch (err: any) {
      setTestWhResult({
        success: false,
        message: err?.response?.data?.message || 'Gagal menjalankan uji webhook',
      })
    } finally {
      setTestingWh(false)
    }
  }

  const waGlobalSettings = globalSettings.filter(s => s.key.startsWith('wa_'))
  const emailGlobalSettings = globalSettings.filter(s => s.key.startsWith('email_'))
  const websiteGlobalSettings = globalSettings.filter(s => s.key === 'landing_page')

  const renderSettingRow = (setting: GlobalSetting) => (
    <div key={setting.key} className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {setting.key.includes('email') ? <Mail size={16} className="text-blue-500" /> :
          setting.key === 'landing_page' ? <Globe size={16} className={setting.is_enabled ? "text-emerald-500" : "text-slate-400"} /> :
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
        {setting.key === 'wa_pendaftaran_admin_phones' && (
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
        {setting.key === 'wa_gateway_base_url' && (
          <input type="text" value={setting.value || ''}
            onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
            placeholder="http://localhost:4300"
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
        )}
        {setting.key === 'wa_gateway_token' && (
          <input type="text" value={setting.value || ''}
            onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
            placeholder="token-rahasia-gateway"
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
        )}
        {setting.key === 'wa_gateway_webhook_secret' && (
          <input type="text" value={setting.value || ''}
            onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
            placeholder="secret-webhook-gateway"
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
        )}
        {setting.key === 'wa_gateway_default_device' && (
          <input type="text" value={setting.value || ''}
            onChange={e => handleGlobalValueChange(setting.key, e.target.value)}
            placeholder="slug-device (atur dari halaman WhatsApp Gateway)"
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-96 font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
        )}
        {setting.key.startsWith('wa_gateway_') || setting.key === 'wa_pembayaran_admin_phones' || setting.key === 'wa_pendaftaran_admin_phones' || setting.key === 'email_pembayaran_admin_addresses' ? (
          <span className="w-11" />
        ) : (
          <button onClick={() => handleGlobalToggle(setting.key, !setting.is_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        )}
      </div>
    </div>
  )

  const renderSettingPanel = (title: string, subtitle: string, icon: React.ReactNode, iconBg: string, iconColor: string, rows: GlobalSetting[], onSave: () => void, savingFlag: boolean) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button onClick={onSave} disabled={savingFlag}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
          {savingFlag ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map(renderSettingRow)}
      </div>
    </div>
  )

  const renderTestEmailCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Send size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Uji Coba Email</h2>
            <p className="text-xs text-slate-500">Kirim email tes untuk memastikan konfigurasi SMTP berfungsi</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
            placeholder="Masukkan alamat email tujuan"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
          <button onClick={handleTestEmail} disabled={testing || !testEmail.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Kirim Tes
          </button>
        </div>
        {testResult && (
          <div className={`p-4 rounded-xl text-sm border ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="font-medium">{testResult.success ? 'Berhasil' : 'Gagal'}</span>
            </div>
            <p>{testResult.message}</p>
            {testResult.config && (
              <pre className="mt-2 text-xs bg-white/60 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(testResult.config, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderTestWaCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <MessageSquare size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Uji Coba WhatsApp</h2>
            <p className="text-xs text-slate-500">Kirim WhatsApp tes untuk memastikan WhatsApp Gateway berfungsi</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="text" value={testWaPhone} onChange={e => setTestWaPhone(e.target.value)}
            placeholder="Masukkan nomor tujuan (628xxx)"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
          <button onClick={handleTestWa} disabled={testingWa || !testWaPhone.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {testingWa ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            Kirim Tes
          </button>
        </div>
        {testWaResult && (
          <div className={`p-4 rounded-xl text-sm border ${testWaResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testWaResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="font-medium">{testWaResult.success ? 'Berhasil' : 'Gagal'}</span>
            </div>
            <p>{testWaResult.message}</p>
            {testWaResult.config && (
              <pre className="mt-2 text-xs bg-white/60 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(testWaResult.config, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderWebhookCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Webhook size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Uji Coba Webhook WhatsApp Gateway</h2>
            <p className="text-xs text-slate-500">Simulasikan pesan masuk (balasan admin) ke endpoint webhook & lihat hasil pemrosesannya</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 space-y-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Webhook URL:</span>{' '}
          <code className="text-[#0E6187] font-mono">https://api.sim.mendunia.id/api/wa-webhook</code>
          <span className="block mt-0.5 text-slate-400">Pesan masuk dari WhatsApp Gateway otomatis diteruskan ke URL ini. Gunakan simulator di bawah untuk menguji alur balasan.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Skenario</label>
            <select value={testWhScenario} onChange={e => handleScenarioChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
              <option value="payment_confirm">Balasan admin mutasi — KONFIRMASI</option>
              <option value="payment_cancel">Balasan admin mutasi — BATAL</option>
              <option value="izin_approve">Balasan manager izin — IYA</option>
              <option value="unknown">Pesan tidak dikenali</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nomor Pengirim</label>
            <input type="text" value={testWhPhone} onChange={e => setTestWhPhone(e.target.value)}
              placeholder="628xxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Isi Pesan</label>
          <input type="text" value={testWhMessage} onChange={e => setTestWhMessage(e.target.value)}
            placeholder="KONFIRMASI / BATAL / IYA / TIDAK"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={testWhUsePayload} onChange={e => setTestWhUsePayload(e.target.checked)} className="rounded border-slate-300" />
            Gunakan payload webhook kustom (JSON)
          </label>
        </div>
        {testWhUsePayload && (
          <textarea value={testWhPayload} onChange={e => setTestWhPayload(e.target.value)} rows={5}
            placeholder='{"data":{"message":{"from":"6282118364415","conversation":"KONFIRMASI"}}}'
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
        )}

        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={testWhExecute} onChange={e => setTestWhExecute(e.target.checked)} className="rounded border-slate-300" />
            Eksekusi sungguhan (mengubah status data)
          </label>
          <button onClick={handleTestWebhook} disabled={testingWh}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {testingWh ? <Loader2 size={14} className="animate-spin" /> : <Webhook size={14} />}
            Uji Webhook
          </button>
        </div>
        {testWhExecute && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            <span>Mode eksekusi sungguhan akan benar-benar memverifikasi/menolak pembayaran atau menyetujui/menolak izin jika ada pengajuan pending yang cocok.</span>
          </div>
        )}

        {testWhResult && (
          <div className={`p-4 rounded-xl text-sm border ${testWhResult.success === false ? 'bg-red-50 border-red-200 text-red-700' : 'bg-violet-50 border-violet-200 text-violet-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testWhResult.success === false ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span className="font-medium">{testWhResult.success === false ? 'Gagal' : 'Payload diproses'}</span>
              {testWhResult.executed && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Eksekusi nyata</span>}
            </div>
            {testWhResult.message && <p>{testWhResult.message}</p>}
            {testWhResult.success !== false && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] text-violet-400 font-semibold uppercase">Parsed From</p>
                    <p className="font-mono font-semibold">{testWhResult.parsed_from || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] text-violet-400 font-semibold uppercase">Parsed Message</p>
                    <p className="font-mono font-semibold">{testWhResult.parsed_message || '-'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${testWhResult.is_payment_admin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    Admin Mutasi: {testWhResult.is_payment_admin ? 'YA' : 'TIDAK'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${testWhResult.is_manager ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    Manager Izin: {testWhResult.is_manager ? 'YA' : 'TIDAK'}
                  </span>
                  {testWhResult.payment_reply && (
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${testWhResult.payment_reply === 'approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      Balasan: {testWhResult.payment_reply === 'approve' ? 'KONFIRMASI (setujui)' : 'BATAL (tolak)'}
                    </span>
                  )}
                  {testWhResult.manager_reply && (
                    <span className="rounded-full px-2.5 py-1 font-semibold bg-blue-100 text-blue-700">Balasan Izin: {testWhResult.manager_reply}</span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${testWhResult.has_pending_payment ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    Ada pembayaran pending: {testWhResult.has_pending_payment ? 'YA' : 'TIDAK'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${testWhResult.has_pending_izin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    Ada izin pending: {testWhResult.has_pending_izin ? 'YA' : 'TIDAK'}
                  </span>
                </div>
                {testWhResult.pending_payment_detail && (
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] text-violet-400 font-semibold uppercase">Detail Pembayaran Pending</p>
                    <p className="font-medium">{testWhResult.pending_payment_detail.nama} — No. Reg: {testWhResult.pending_payment_detail.no_registrasi || '-'} (Status: {testWhResult.pending_payment_detail.status_pembayaran})</p>
                  </div>
                )}
                {testWhResult.executed ? (
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] text-violet-400 font-semibold uppercase">Hasil Webhook</p>
                    <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(testWhResult.webhook_result, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] text-violet-400 font-semibold uppercase">Prediksi Hasil</p>
                    <p className="font-medium">{testWhResult.expected || '-'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderInfoBox = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
      <p className="font-medium mb-2">Cara kerja notifikasi otomatis:</p>
      <ul className="list-disc list-inside space-y-1.5 text-xs">
        <li>Pengingat dikirim setiap hari jam 09:00 via <code className="bg-blue-100 px-1 rounded">php artisan app:reminder-pembayaran</code></li>
        <li>WhatsApp dikirim melalui WhatsApp Gateway internal (Baileys) — atur Base URL & Token di menu "Notifikasi WhatsApp"</li>
        <li>Email memerlukan konfigurasi SMTP — atur pada menu "Notifikasi Email" (menggantikan konfigurasi <code className="bg-blue-100 px-1 rounded">.env</code>)</li>
        <li>Jika SMTP belum dikonfigurasi, email akan di-log saja (tidak terkirim)</li>
        <li>Pengingat tidak akan dikirim jika kategori sudah lunas</li>
      </ul>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#0E6187]" size={32} />
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'wa', label: 'Notifikasi WhatsApp', icon: <MessageSquare size={16} />, color: 'text-emerald-600' },
    { id: 'email', label: 'Notifikasi Email', icon: <Mail size={16} />, color: 'text-blue-600' },
    { id: 'website', label: 'Website', icon: <Globe size={16} />, color: 'text-[#0E6187]' },
    { id: 'ai', label: 'AI Assistant', icon: <Bot size={16} />, color: 'text-fuchsia-600' },
    { id: 'uji', label: 'Uji Coba & Panduan', icon: <FlaskConical size={16} />, color: 'text-violet-600' },
  ]

  return (
    <div className="space-y-6">
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

      {/* Tab menu */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border-2 transition-colors ${activeTab === tab.id ? 'bg-[#0E6187] border-[#0E6187] text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-[#0E6187]/40 hover:text-[#0E6187]'}`}>
            <span className={activeTab === tab.id ? 'text-white' : tab.color}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Notifikasi WhatsApp ===== */}
      {activeTab === 'wa' && (
        <>
          {renderSettingPanel(
            'Pengaturan WhatsApp',
            'Aktifkan/nonaktifkan notifikasi WhatsApp & konfigurasi WhatsApp Gateway',
            <MessageSquare size={20} className="text-emerald-600" />,
            'bg-emerald-500/10',
            'text-emerald-600',
            waGlobalSettings,
            saveGlobal,
            saving,
          )}
          {renderTestWaCard()}
        </>
      )}

      {/* ===== Notifikasi Email ===== */}
      {activeTab === 'email' && (
        <>
          {renderSettingPanel(
            'Pengaturan Email',
            'Aktifkan/nonaktifkan notifikasi email & alamat penerima',
            <Mail size={20} className="text-blue-600" />,
            'bg-blue-500/10',
            'text-blue-600',
            emailGlobalSettings,
            saveGlobal,
            saving,
          )}

          {/* SMTP Email Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Pengaturan SMTP Email</h2>
                  <p className="text-xs text-slate-500">Konfigurasi server email untuk pengiriman notifikasi (dipakai menggantikan .env)</p>
                </div>
              </div>
              <button onClick={saveMail} disabled={savingMail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {savingMail ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mailSettings.map(setting => {
                  const val = setting.value ?? ''
                  return (
                    <div key={setting.key}>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        {setting.description}
                        <span className="ml-1 text-xs text-slate-400 font-mono">{setting.key}</span>
                      </label>
                      {setting.key === 'mail_encryption' ? (
                        <select value={val} onChange={e => handleMailValueChange(setting.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20">
                          <option value="tls">tls</option>
                          <option value="ssl">ssl</option>
                          <option value="">none</option>
                        </select>
                      ) : setting.key === 'mail_mailer' ? (
                        <select value={val} onChange={e => handleMailValueChange(setting.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20">
                          <option value="smtp">smtp</option>
                          <option value="log">log</option>
                        </select>
                      ) : (
                        <input
                          type={setting.key === 'mail_password' ? 'password' : setting.key === 'mail_port' ? 'number' : 'text'}
                          value={val}
                          onChange={e => handleMailValueChange(setting.key, e.target.value)}
                          placeholder={setting.key === 'mail_host' ? 'smtp.gmail.com' : setting.key === 'mail_port' ? '587' : setting.key === 'mail_encryption' ? 'tls' : ''}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Kosongkan field untuk memakai nilai bawaan dari <code className="bg-slate-100 px-1 rounded">.env</code>. Konfigurasi ini langsung dipakai untuk pengiriman email setelah disimpan.
              </p>
            </div>
          </div>

          {renderTestEmailCard()}
        </>
      )}

      {/* ===== Website ===== */}
      {activeTab === 'website' && (
        <>
          {renderSettingPanel(
            'Pengaturan Website',
            'Tampilkan/sembunyikan halaman landing (website publik)',
            <Globe size={20} className="text-[#0E6187]" />,
            'bg-[#0E6187]/10',
            'text-[#0E6187]',
            websiteGlobalSettings,
            saveGlobal,
            saving,
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600">
              Saat <span className="font-semibold text-slate-700">"Halaman landing/website publik ditampilkan"</span> dimatikan, maka:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-500 list-disc list-inside">
              <li>Akses ke <code className="bg-slate-100 px-1 rounded">/landing</code> dan halaman publik lainnya akan dialihkan ke halaman login</li>
              <li>Menu <span className="font-medium text-slate-700">"Lihat Website"</span> di sidebar tidak ditampilkan</li>
            </ul>
          </div>
        </>
      )}

      {/* ===== AI Assistant ===== */}
      {activeTab === 'ai' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                  <Bot size={20} className="text-fuchsia-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">AI Assistant</h2>
                  <p className="text-xs text-slate-500">Isi API key provider AI (Groq / Gemini) agar fitur AI Chat bekerja</p>
                </div>
              </div>
              <button onClick={saveAi} disabled={savingAi}
                className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-xl text-sm font-medium hover:bg-[#1a2d4d] disabled:opacity-50 transition-colors">
                {savingAi ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Provider AI</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {([
                    ['groq', 'Groq', 'bg-slate-800'],
                    ['gemini', 'Gemini', 'bg-gradient-to-br from-blue-500 to-indigo-600'],
                    ['claude', 'Claude', 'bg-orange-600'],
                    ['gpt', 'GPT', 'bg-emerald-600'],
                    ['modelsstudio', 'Model Studio', 'bg-cyan-600'],
                  ] as [AiProvider, string, string][]).map(([p, label, iconBg]) => (
                    <button key={p} onClick={() => setAiProvider(p)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${aiProvider === p ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
                        <Bot size={18} className="text-white" />
                      </span>
                      <span className="text-left">
                        <span className="block text-sm font-semibold text-slate-700">{label}</span>
                        <span className="block text-xs text-slate-400 max-w-[10rem] truncate">{providerModels[p] || label.toLowerCase()}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['groq', 'Groq', 'gsk_xxxxxxxxxxxx', aiGroqKey, setAiGroqKey, aiGroqModel, setAiGroqModel, undefined, undefined],
                  ['gemini', 'Gemini', 'AIzaSyxxxxxxxxxxxx', aiGeminiKey, setAiGeminiKey, aiGeminiModel, setAiGeminiModel, undefined, undefined],
                  ['claude', 'Claude', 'sk-ant-xxxxxxxxxxxx', aiClaudeKey, setAiClaudeKey, aiClaudeModel, setAiClaudeModel, undefined, undefined],
                  ['gpt', 'GPT', 'sk-xxxxxxxxxxxx', aiGptKey, setAiGptKey, aiGptModel, setAiGptModel, undefined, undefined],
                  ['modelsstudio', 'Model Studio', 'sk-ws-xxxxxxxxxxxx', aiMsKey, setAiMsKey, aiMsModel, setAiMsModel, aiMsBaseUrl, setAiMsBaseUrl],
                ] as [AiProvider, string, string, string, (v: string) => void, string, (v: string) => void, string | undefined, ((v: string) => void) | undefined][]).map(([p, label, placeholder, keyValue, setKey, modelValue, setModel, baseUrlValue, setBaseUrl]) => (
                  <div key={p} className="p-4 rounded-xl border-2 border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{label}</span>
                      {getConfigured(p) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          <CheckCircle size={10} /> Key terpasang
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                          Key belum diisi
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                        <KeyRound size={12} className="text-slate-400" /> API Key
                      </label>
                      <input type="password" value={keyValue}
                        onChange={e => setKey(e.target.value)}
                        placeholder={getMaskedKey(p) || placeholder}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                    </div>
                    {setBaseUrl && (
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                          <Globe size={12} className="text-slate-400" /> Base URL (workspace)
                        </label>
                        <input type="text" value={baseUrlValue || ''}
                          onChange={e => setBaseUrl(e.target.value)}
                          placeholder={aiSettings?.base_urls?.modelsstudio || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                      </div>
                    )}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                        <Activity size={12} className="text-slate-400" /> Model
                      </label>
                      <input type="text" value={modelValue}
                        onChange={e => setModel(e.target.value)}
                        placeholder={aiSettings?.models?.[p] || 'nama-model'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20" />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Cek Koneksi</label>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={testAi} disabled={testingAi}
                    className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl text-sm font-medium hover:bg-fuchsia-700 disabled:opacity-50 transition-colors">
                    {testingAi ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                    Uji Koneksi {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}
                  </button>
                  <span className="text-xs text-slate-400">
                    Menggunakan key yang sedang diketik (atau key yang sudah tersimpan jika kosong)
                  </span>
                </div>
                {aiTestResult && (
                  <div className={`mt-3 p-4 rounded-xl text-sm border ${aiTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {aiTestResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      <span className="font-medium">{aiTestResult.success ? 'Berhasil' : 'Gagal'}</span>
                    </div>
                    <p>{aiTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600">
              AI Assistant dipakai oleh fitur <span className="font-semibold text-slate-700">AI Chat</span> (menu sidebar) dan import data via AI.
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-500 list-disc list-inside">
              <li><span className="font-semibold text-slate-700">Groq</span> — ambil key di <code className="bg-slate-100 px-1 rounded">console.groq.com</code>, format: <code className="bg-slate-100 px-1 rounded">gsk_xxx</code></li>
              <li><span className="font-semibold text-slate-700">Gemini</span> — ambil key di <code className="bg-slate-100 px-1 rounded">aistudio.google.com/apikey</code>, format: <code className="bg-slate-100 px-1 rounded">AIzaSyxxx</code></li>
              <li><span className="font-semibold text-slate-700">Claude</span> — ambil key di <code className="bg-slate-100 px-1 rounded">console.anthropic.com</code>, format: <code className="bg-slate-100 px-1 rounded">sk-ant-xxx</code></li>
              <li><span className="font-semibold text-slate-700">GPT</span> — ambil key di <code className="bg-slate-100 px-1 rounded">platform.openai.com/api-keys</code>, format: <code className="bg-slate-100 px-1 rounded">sk-xxx</code></li>
              <li><span className="font-semibold text-slate-700">Model Studio (Qwen/Alibaba)</span> — ambil key di <code className="bg-slate-100 px-1 rounded">modelstudio.console.alibabacloud.com</code>, format: <code className="bg-slate-100 px-1 rounded">sk-ws-xxx</code>. Base URL default <code className="bg-slate-100 px-1 rounded">dashscope-intl.aliyuncs.com/compatible-mode/v1</code> — bisa diganti dengan domain dedicated workspace Anda.</li>
              <li>Key tersimpan di database dan tidak pernah ditampilkan penuh (termasking).</li>
            </ul>
          </div>
        </>
      )}

      {/* ===== Uji Coba & Panduan ===== */}
      {activeTab === 'uji' && (
        <>
          {renderTestEmailCard()}
          {renderTestWaCard()}
          {renderWebhookCard()}
          {renderInfoBox()}
        </>
      )}

      <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
        <Settings size={14} className="text-[#0E6187]" />
        Semua perubahan disimpan ke database dan langsung berlaku.
      </div>
    </div>
  )
}