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
      <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8] border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
          <Timer size={20} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-[#202124]">Pengaturan Shift</h1>
          <p className="text-sm text-[#5f6368]">Atur mode shift yang digunakan untuk absensi karyawan</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-[#e6f4ea] border border-[#a8dab5] px-4 py-3 text-sm text-[#137333]">
          {success}
        </div>
      )}

      <div className="bg-white border border-[#dadce0] overflow-hidden mb-4">
        <div className="p-5">
          <label className="block text-sm font-semibold text-[#202124] mb-1">Mode Shift</label>
          <p className="text-sm text-[#5f6368] mb-4">Pilih mode yang digunakan untuk menentukan shift karyawan saat absensi.</p>

          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 border cursor-pointer transition ${mode === 'fixed' ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#dadce0] hover:border-[#dadce0]'}`}>
              <input
                type="radio"
                name="shift_mode"
                value="fixed"
                checked={mode === 'fixed'}
                onChange={(e) => setMode(e.target.value)}
                className="mt-0.5 h-4 w-4 text-[#1a73e8]"
              />
              <div>
                <span className="block text-sm font-medium text-[#202124]">Shift Tetap (Default)</span>
                <span className="block text-xs text-[#5f6368] mt-0.5">Karyawan menggunakan shift tetap yang ditentukan pada data karyawan. Shift Jadwal per tanggal tidak digunakan.</span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 border cursor-pointer transition ${mode === 'jadwal' ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#dadce0] hover:border-[#dadce0]'}`}>
              <input
                type="radio"
                name="shift_mode"
                value="jadwal"
                checked={mode === 'jadwal'}
                onChange={(e) => setMode(e.target.value)}
                className="mt-0.5 h-4 w-4 text-[#1a73e8]"
              />
              <div>
                <span className="block text-sm font-medium text-[#202124]">Jadwal Shift (Per Tanggal)</span>
                <span className="block text-xs text-[#5f6368] mt-0.5">Karyawan menggunakan shift berdasarkan jadwal yang telah ditentukan per tanggal di menu Jadwal Shift. Shift tetap pada data karyawan tidak digunakan.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-medium text-white hover:bg-[#202124] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dadce0] overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-[#5f6368]" />
            <h6 className="text-sm font-semibold text-[#202124]">Informasi</h6>
          </div>
          <ul className="space-y-2 text-sm text-[#5f6368]">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 bg-[#bdc1c6] shrink-0" />
              <span><strong>Shift Tetap:</strong> Shift diambil dari kolom "Shift" pada data karyawan. Cocok untuk karyawan dengan jadwal tetap setiap hari.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 bg-[#bdc1c6] shrink-0" />
              <span><strong>Jadwal Shift:</strong> Shift diambil dari pengaturan Jadwal Shift per tanggal. Cocok untuk karyawan dengan jadwal rotasi atau shift bergantian.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 bg-[#bdc1c6] shrink-0" />
              <span>Perubahan mode akan langsung berlaku untuk absensi selanjutnya.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}