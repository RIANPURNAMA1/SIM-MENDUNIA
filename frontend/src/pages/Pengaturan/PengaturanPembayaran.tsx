import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Save, Loader2, Plus, Trash2, Edit3, X, CreditCard, Building2, Upload, Check, Copy, ChevronRight, LayoutDashboard } from 'lucide-react'
import Swal from 'sweetalert2'
import { paymentSettingApi } from '../../services/api'

const fbCardClass = "border border-[#dadce0] bg-white"

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
          <div className="rounded-full absolute inset-0 border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
            <LayoutDashboard size={13} />
            <span>Beranda</span>
          </Link>
          <ChevronRight size={12} className="text-[#9aa0a6]" />
          <span className="font-medium text-[#3c4043]">Pengaturan Pembayaran</span>
        </nav>

        {/* HEADER */}
        <div className={`${fbCardClass} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#202124] leading-tight">Pengaturan Pembayaran</h1>
              <p className="text-[13px] text-[#5f6368]">Kode unik & rekening tujuan transfer</p>
            </div>
          </div>
        </div>

        {/* UNIQUE CODE SETTINGS */}
        <div className={`${fbCardClass} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-[#e8eaed] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-[#5f6368]" />
              <h2 className="text-[15px] font-bold text-[#202124]">Kode Unik Pembayaran Manual</h2>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white text-sm font-semibold hover:bg-[#1a5e6f] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Toggle Manual Payment */}
            <div className="flex items-center justify-between py-3 border-b border-[#f8f9fa]">
              <div>
                <p className="text-[14px] font-semibold text-[#202124]">Aktifkan Pembayaran Manual</p>
                <p className="text-[12px] text-[#5f6368]">Aktifkan metode pembayaran transfer bank</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, manual_payment_enabled: !s.manual_payment_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center transition-colors ${settings.manual_payment_enabled ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}
              >
                <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${settings.manual_payment_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Unique Code Max */}
            <div className="py-3 border-b border-[#f8f9fa]">
              <label className="block text-[14px] font-semibold text-[#202124] mb-1">Maksimal Kode Unik</label>
              <p className="text-[12px] text-[#5f6368] mb-2">Sistem akan menghasilkan angka acak dari 1 sampai batas maksimal ini</p>
              <input
                type="number"
                min={1}
                value={settings.unique_code_max}
                onChange={e => setSettings(s => ({ ...s, unique_code_max: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm"
                placeholder="Contoh: 99"
              />
              <p className="text-[11px] text-[#80868b] mt-1">
                Contoh: 99 = kode unik antara 1-99, 999 = kode unik antara 1-999
              </p>
            </div>

            {/* Unique Code Operation */}
            <div className="py-3">
              <label className="block text-[14px] font-semibold text-[#202124] mb-1">Pengoperasian Kode Unik</label>
              <p className="text-[12px] text-[#5f6368] mb-2">Pilih apakah kode unik ditambahkan atau dikurangkan dari total tagihan</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettings(s => ({ ...s, unique_code_operation: 'add' }))}
                  className={`flex-1 py-2.5 text-sm font-semibold border transition-colors ${ settings.unique_code_operation === 'add' ? 'bg-[#0E6187] text-white border-[#1a73e8]' : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#dadce0]' }`}
                >
                  Tambahkan (+)
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, unique_code_operation: 'subtract' }))}
                  className={`flex-1 py-2.5 text-sm font-semibold border transition-colors ${ settings.unique_code_operation === 'subtract' ? 'bg-[#0E6187] text-white border-[#1a73e8]' : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#dadce0]' }`}
                >
                  Kurangkan (-)
                </button>
              </div>
              <p className="text-[11px] text-[#80868b] mt-2">
                {settings.unique_code_operation === 'add'
                  ? `Tagihan Rp200.000 + kode unik 27 = Rp200.027`
                  : `Tagihan Rp200.000 - kode unik 27 = Rp199.973`
                }
              </p>
            </div>

            {/* Preview */}
            <div className="bg-[#f8f9fa] p-4 border border-[#e8eaed]">
              <p className="text-[12px] font-semibold text-[#5f6368] mb-2">Contoh Perhitungan</p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#5f6368]">Tagihan</span>
                  <span className="font-medium text-[#202124]">Rp 200.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5f6368]">Kode Unik (acak 1-{settings.unique_code_max})</span>
                  <span className="font-medium text-[#1a73e8]">27</span>
                </div>
                <div className="border-t border-[#dadce0] pt-1.5 flex justify-between font-bold">
                  <span className="text-[#202124]">Total Transfer</span>
                  <span className="text-[#202124]">
                    {settings.unique_code_operation === 'add' ? 'Rp 200.027' : 'Rp 199.973'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BANK ACCOUNTS */}
        <div className={`${fbCardClass} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-[#e8eaed] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#5f6368]" />
              <h2 className="text-[15px] font-bold text-[#202124]">Informasi Rekening</h2>
            </div>
            <button
              onClick={openAddBank}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0E6187] text-white text-sm font-semibold hover:bg-[#084c63] transition-colors"
            >
              <Plus size={14} /> Tambah Rekening
            </button>
          </div>

          <div className="p-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-[#80868b]">
                <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada rekening bank</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map(account => (
                  <div key={account.id} className="border border-[#e8eaed] p-4 hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.bank_logo_url ? (
                          <img src={account.bank_logo_url} alt={account.bank_name} className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 border border-[#dadce0] bg-[#f1f3f4] flex items-center justify-center">
                            <Building2 size={18} className="text-[#5f6368]" />
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-bold text-[#202124]">{account.bank_name}</p>
                          <p className="text-[12px] text-[#5f6368]">a.n {account.account_holder}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${account.is_active ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                          {account.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button onClick={() => openEditBank(account)} className="p-1.5 hover:bg-[#f1f3f4] text-[#80868b] hover:text-[#5f6368] transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteBank(account.id)} className="p-1.5 hover:bg-[#fce8e6] text-[#80868b] hover:text-[#d93025] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#5f6368]">No. Rekening:</span>
                        <span className="text-[14px] font-bold font-mono text-[#202124]">{account.account_number}</span>
                        <button onClick={() => copyToClipboard(account.account_number)} className="p-1 hover:bg-[#e8eaed] transition-colors" title="Salin">
                          <Copy size={12} className="text-[#80868b]" />
                        </button>
                      </div>
                      {account.branch && (
                        <span className="text-[12px] text-[#80868b]">Cabang: {account.branch}</span>
                      )}
                    </div>

                    {account.additional_info && (
                      <p className="mt-2 text-[12px] text-[#5f6368] bg-[#f8f9fa] px-3 py-1.5">{account.additional_info}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BANK ACCOUNT MODAL */}
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setShowBankModal(false)}>
            <div className="w-full max-w-lg bg-white border border-[#dadce0] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#202124]">{editingBank ? 'Edit Rekening' : 'Tambah Rekening'}</h2>
                <button onClick={() => setShowBankModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                  <X size={20} className="text-[#5f6368]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Nama Bank <span className="text-[#d93025]">*</span></label>
                  <input type="text" value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                    placeholder="Contoh: BCA, Mandiri, BRI"
                    className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Nama Pemilik Rekening <span className="text-[#d93025]">*</span></label>
                  <input type="text" value={bankForm.account_holder} onChange={e => setBankForm(f => ({ ...f, account_holder: e.target.value }))}
                    placeholder="Contoh: PT. INDONESIA SUKSES MENDUNIA"
                    className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Nomor Rekening <span className="text-[#d93025]">*</span></label>
                  <input type="text" value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))}
                    placeholder="Contoh: 1831813364"
                    className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Cabang (Opsional)</label>
                  <input type="text" value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))}
                    placeholder="Contoh: Jakarta Pusat"
                    className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Informasi Tambahan (Opsional)</label>
                  <textarea value={bankForm.additional_info} onChange={e => setBankForm(f => ({ ...f, additional_info: e.target.value }))}
                    placeholder="Contoh: Transfer ke rekening ini untuk pembayaran pendaftaran"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] outline-none transition-colors text-sm resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Logo Bank (Opsional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#dadce0] cursor-pointer bg-[#f8f9fa] hover:bg-white hover:border-[#1a73e8] transition-colors">
                    {bankLogoPreview ? (
                      <img src={bankLogoPreview} alt="Logo" className="h-16 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-5 h-5 text-[#80868b]" />
                        <p className="text-[11px] text-[#5f6368] mt-1">Klik untuk upload logo bank</p>
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
                    className={`relative inline-flex h-6 w-11 items-center transition-colors ${bankForm.is_active ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${bankForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-[#3c4043]">{bankForm.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowBankModal(false)}
                    className="px-6 py-2.5 border border-[#dadce0] text-[#3c4043] text-sm font-semibold hover:bg-[#f8f9fa] transition-colors">
                    Batal
                  </button>
                  <button type="button" onClick={handleSaveBank}
                    className="px-8 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bg-[#1a5e6f] transition-colors inline-flex items-center gap-2">
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
