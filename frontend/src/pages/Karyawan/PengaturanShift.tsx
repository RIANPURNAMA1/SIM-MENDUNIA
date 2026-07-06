import { useState, useEffect } from 'react'
import { Timer, Info } from 'lucide-react'
import { pengaturanShiftApi } from '../../services/api'

export default function PengaturanShiftPage() {
  const [mode, setMode] = useState('fixed')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    pengaturanShiftApi.get()
      .then((res) => setMode(res.data.data.mode))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    try {
      await pengaturanShiftApi.update({ shift_mode: mode })
      setSuccess('Mode shift berhasil diperbarui')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-100 rounded" />
            <div className="h-20 bg-slate-100 rounded-lg" />
            <div className="h-20 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
          <Timer size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Pengaturan Shift</h1>
          <p className="text-sm text-slate-500">Atur mode shift yang digunakan untuk absensi karyawan</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-1">Mode Shift</label>
          <p className="text-sm text-gray-500 mb-4">Pilih mode yang digunakan untuk menentukan shift karyawan saat absensi.</p>

          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${mode === 'fixed' ? 'border-[#0D1F3C] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="shift_mode"
                value="fixed"
                checked={mode === 'fixed'}
                onChange={(e) => setMode(e.target.value)}
                className="mt-0.5 h-4 w-4 text-[#0D1F3C] focus:ring-[#0D1F3C]"
              />
              <div>
                <span className="block text-sm font-medium text-gray-800">Shift Tetap (Default)</span>
                <span className="block text-xs text-gray-500 mt-0.5">Karyawan menggunakan shift tetap yang ditentukan pada data karyawan. Shift Jadwal per tanggal tidak digunakan.</span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${mode === 'jadwal' ? 'border-[#0D1F3C] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="shift_mode"
                value="jadwal"
                checked={mode === 'jadwal'}
                onChange={(e) => setMode(e.target.value)}
                className="mt-0.5 h-4 w-4 text-[#0D1F3C] focus:ring-[#0D1F3C]"
              />
              <div>
                <span className="block text-sm font-medium text-gray-800">Jadwal Shift (Per Tanggal)</span>
                <span className="block text-xs text-gray-500 mt-0.5">Karyawan menggunakan shift berdasarkan jadwal yang telah ditentukan per tanggal di menu Jadwal Shift. Shift tetap pada data karyawan tidak digunakan.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0D1F3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a3054] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-gray-500" />
            <h6 className="text-sm font-semibold text-gray-800">Informasi</h6>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span><strong>Shift Tetap:</strong> Shift diambil dari kolom "Shift" pada data karyawan. Cocok untuk karyawan dengan jadwal tetap setiap hari.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span><strong>Jadwal Shift:</strong> Shift diambil dari pengaturan Jadwal Shift per tanggal. Cocok untuk karyawan dengan jadwal rotasi atau shift bergantian.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Perubahan mode akan langsung berlaku untuk absensi selanjutnya.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}