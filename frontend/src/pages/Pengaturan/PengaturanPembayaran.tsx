import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Plus, Trash2, Edit3, X, CreditCard, Building2, Upload, Check, Copy } from 'lucide-react'
import Swal from 'sweetalert2'
import { paymentSettingApi } from '../../services/api'

const fbCardClass = "bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.12)]"

interface PaymentSettings {
  manual_payment_enabled: boolean
  unique_code_max: string
  unique_code_operation: string
}

interface BankAccount {
  id: number
  bank_name: string
  bank_logo: string | null
  bank_logo_url: string | null
  account_holder: string
  account_number: string
  branch: string | null
  additional_info: string | null
  is_active: boolean
}

export default function PengaturanPembayaran() {
  const [settings, setSettings] = useState<PaymentSettings>({
    manual_payment_enabled: false,
    unique_code_max: '99',
    unique_code_operation: 'add',
  })
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    branch: '',
    additional_info: '',
    is_active: true,
  })
  const [bankLogo, setBankLogo] = useState<File | null>(null)
  const [bankLogoPreview, setBankLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setLoading(true)
    Promise.all([
      paymentSettingApi.getSettings(),
      paymentSettingApi.getBankAccounts(),
    ]).then(([settingsRes, banksRes]) => {
      const s = settingsRes.data
      setSettings({
        manual_payment_enabled: s.manual_payment_enabled?.is_enabled ?? false,
        unique_code_max: s.unique_code_max?.value ?? '99',
        unique_code_operation: s.unique_code_operation?.value ?? 'add',
      })
      setBankAccounts(banksRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  function handleSaveSettings() {
    setSaving(true)
    paymentSettingApi.updateSettings({
      manual_payment_enabled: settings.manual_payment_enabled,
      unique_code_max: settings.unique_code_max,
      unique_code_operation: settings.unique_code_operation,
    }).then(() => {
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan pembayaran disimpan', timer: 1500, showConfirmButton: false })
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan pengaturan' })
    }).finally(() => setSaving(false))
  }

  function openAddBank() {
    setEditingBank(null)
    setBankForm({ bank_name: '', account_holder: '', account_number: '', branch: '', additional_info: '', is_active: true })
    setBankLogo(null)
    setBankLogoPreview(null)
    setShowBankModal(true)
  }

  function openEditBank(account: BankAccount) {
    setEditingBank(account)
    setBankForm({
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number,
      branch: account.branch || '',
      additional_info: account.additional_info || '',
      is_active: account.is_active,
    })
    setBankLogo(null)
    setBankLogoPreview(account.bank_logo_url || null)
    setShowBankModal(true)
  }

  function handleSaveBank() {
    if (!bankForm.bank_name || !bankForm.account_holder || !bankForm.account_number) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Nama bank, pemilik rekening, dan nomor rekening wajib diisi' })
      return
    }

    const fd = new FormData()
    fd.append('bank_name', bankForm.bank_name)
    fd.append('account_holder', bankForm.account_holder)
    fd.append('account_number', bankForm.account_number)
    fd.append('branch', bankForm.branch)
    fd.append('additional_info', bankForm.additional_info)
    fd.append('is_active', bankForm.is_active ? '1' : '0')
    if (bankLogo) fd.append('bank_logo', bankLogo)

    const req = editingBank
      ? paymentSettingApi.updateBankAccount(editingBank.id, fd)
      : paymentSettingApi.createBankAccount(fd)

    req.then(() => {
      Swal.fire({ icon: 'success', title: 'Berhasil', text: editingBank ? 'Rekening diperbarui' : 'Rekening ditambahkan', timer: 1500, showConfirmButton: false })
      setShowBankModal(false)
      loadData()
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan rekening' })
    })
  }

  function handleDeleteBank(id: number) {
    Swal.fire({
      title: 'Hapus Rekening?',
      text: 'Rekening akan dihapus permanen',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        paymentSettingApi.deleteBankAccount(id).then(() => {
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
          loadData()
        })
      }
    })
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

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

  return (
    <div className="min-h-screen bg-[#F0F2F5] px-4 py-6 sm:px-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">

        {/* HEADER */}
        <div className={`${fbCardClass} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <CreditCard size={20} className="text-[#0E6187]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Pengaturan Pembayaran</h1>
              <p className="text-[13px] text-gray-500">Kode unik & rekening tujuan transfer</p>
            </div>
          </div>
        </div>

        {/* UNIQUE CODE SETTINGS */}
        <div className={`${fbCardClass} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-[#0E6187]" />
              <h2 className="text-[15px] font-bold text-gray-900">Kode Unik Pembayaran Manual</h2>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Toggle Manual Payment */}
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-[14px] font-semibold text-gray-800">Aktifkan Pembayaran Manual</p>
                <p className="text-[12px] text-gray-500">Aktifkan metode pembayaran transfer bank</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, manual_payment_enabled: !s.manual_payment_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.manual_payment_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.manual_payment_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Unique Code Max */}
            <div className="py-3 border-b border-gray-50">
              <label className="block text-[14px] font-semibold text-gray-800 mb-1">Maksimal Kode Unik</label>
              <p className="text-[12px] text-gray-500 mb-2">Sistem akan menghasilkan angka acak dari 1 sampai batas maksimal ini</p>
              <input
                type="number"
                min={1}
                value={settings.unique_code_max}
                onChange={e => setSettings(s => ({ ...s, unique_code_max: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                placeholder="Contoh: 99"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Contoh: 99 = kode unik antara 1-99, 999 = kode unik antara 1-999
              </p>
            </div>

            {/* Unique Code Operation */}
            <div className="py-3">
              <label className="block text-[14px] font-semibold text-gray-800 mb-1">Pengoperasian Kode Unik</label>
              <p className="text-[12px] text-gray-500 mb-2">Pilih apakah kode unik ditambahkan atau dikurangkan dari total tagihan</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettings(s => ({ ...s, unique_code_operation: 'add' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    settings.unique_code_operation === 'add'
                      ? 'bg-[#0E6187] text-white border-[#0E6187]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Tambahkan (+)
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, unique_code_operation: 'subtract' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    settings.unique_code_operation === 'subtract'
                      ? 'bg-[#0E6187] text-white border-[#0E6187]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Kurangkan (-)
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {settings.unique_code_operation === 'add'
                  ? `Tagihan Rp200.000 + kode unik 27 = Rp200.027`
                  : `Tagihan Rp200.000 - kode unik 27 = Rp199.973`
                }
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-2">Contoh Perhitungan</p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tagihan</span>
                  <span className="font-medium text-gray-800">Rp 200.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kode Unik (acak 1-{settings.unique_code_max})</span>
                  <span className="font-medium text-[#0E6187]">27</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold">
                  <span className="text-gray-800">Total Transfer</span>
                  <span className="text-gray-900">
                    {settings.unique_code_operation === 'add' ? 'Rp 200.027' : 'Rp 199.973'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BANK ACCOUNTS */}
        <div className={`${fbCardClass} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#0E6187]" />
              <h2 className="text-[15px] font-bold text-gray-900">Informasi Rekening</h2>
            </div>
            <button
              onClick={openAddBank}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Plus size={14} /> Tambah Rekening
            </button>
          </div>

          <div className="p-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada rekening bank</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map(account => (
                  <div key={account.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.bank_logo_url ? (
                          <img src={account.bank_logo_url} alt={account.bank_name} className="w-10 h-10 rounded-lg object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
                            <Building2 size={18} className="text-[#0E6187]" />
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-bold text-gray-900">{account.bank_name}</p>
                          <p className="text-[12px] text-gray-500">a.n {account.account_holder}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${account.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {account.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button onClick={() => openEditBank(account)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteBank(account.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-500">No. Rekening:</span>
                        <span className="text-[14px] font-bold font-mono text-gray-900">{account.account_number}</span>
                        <button onClick={() => copyToClipboard(account.account_number)} className="p-1 rounded hover:bg-gray-200 transition-colors" title="Salin">
                          <Copy size={12} className="text-gray-400" />
                        </button>
                      </div>
                      {account.branch && (
                        <span className="text-[12px] text-gray-400">Cabang: {account.branch}</span>
                      )}
                    </div>

                    {account.additional_info && (
                      <p className="mt-2 text-[12px] text-gray-500 bg-gray-50 rounded px-3 py-1.5">{account.additional_info}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BANK ACCOUNT MODAL */}
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowBankModal(false)}>
            <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{editingBank ? 'Edit Rekening' : 'Tambah Rekening'}</h2>
                <button onClick={() => setShowBankModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank <span className="text-red-500">*</span></label>
                  <input type="text" value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                    placeholder="Contoh: BCA, Mandiri, BRI"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                  <input type="text" value={bankForm.account_holder} onChange={e => setBankForm(f => ({ ...f, account_holder: e.target.value }))}
                    placeholder="Contoh: PT. INDONESIA SUKSES MENDUNIA"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening <span className="text-red-500">*</span></label>
                  <input type="text" value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))}
                    placeholder="Contoh: 1831813364"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabang (Opsional)</label>
                  <input type="text" value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))}
                    placeholder="Contoh: Jakarta Pusat"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Informasi Tambahan (Opsional)</label>
                  <textarea value={bankForm.additional_info} onChange={e => setBankForm(f => ({ ...f, additional_info: e.target.value }))}
                    placeholder="Contoh: Transfer ke rekening ini untuk pembayaran pendaftaran"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Bank (Opsional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-white hover:border-[#0E6187] transition-colors">
                    {bankLogoPreview ? (
                      <img src={bankLogoPreview} alt="Logo" className="h-16 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <p className="text-[11px] text-gray-500 mt-1">Klik untuk upload logo bank</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setBankLogo(file)
                        setBankLogoPreview(URL.createObjectURL(file))
                      }
                    }} />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBankForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bankForm.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bankForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-gray-700">{bankForm.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowBankModal(false)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button type="button" onClick={handleSaveBank}
                    className="px-8 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] transition-colors inline-flex items-center gap-2">
                    <Save size={14} /> {editingBank ? 'Perbarui' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
