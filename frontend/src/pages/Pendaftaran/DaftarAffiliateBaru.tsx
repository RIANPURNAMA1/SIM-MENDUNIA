import { useState } from 'react'
import { Loader } from 'lucide-react'
import { authApi } from '../../services/api'

export default function DaftarAffiliateBaru() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', telepon: '', alamat: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    authApi.registerAffiliate(form)
      .then(() => {
        window.location.href = '/affiliate-dashboard'
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[396px] fade-in">
        {/* Header */}
        <div className="text-center mb-5">
          <img
            src="/logo-sm.png"
            alt="Mendunia"
            className="w-16 h-16 mx-auto mb-3"
          />
          <h1 className="text-2xl font-extrabold text-[#0D1F3C] tracking-tight">Daftar Affiliate</h1>
          <p className="text-sm text-[#606770] mt-1 font-medium">
            Bergabung jadi affiliate dan dapatkan komisi
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-4 pb-6">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#0D1F3C] mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Lengkap"
                className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D1F3C] mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D1F3C] mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Password (min 6 karakter)"
                className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D1F3C] mb-1">Telepon <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.telepon}
                onChange={e => setForm({ ...form, telepon: e.target.value })}
                placeholder="Telepon"
                className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D1F3C] mb-1">Alamat <span className="text-red-500">*</span></label>
              <textarea
                value={form.alamat}
                required
                onChange={e => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat"
                rows={2}
                className="w-full px-4 py-3 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[48px] bg-[#0D1F3C] text-white rounded-lg font-bold text-xl hover:bg-[#1a2d4a] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                'Daftar'
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center mt-5 text-sm text-[#606770]">
          Sudah punya akun?{' '}
          <a href="http://localhost:5173/login" className="font-semibold text-[#0D1F3C] hover:underline">
            Masuk
          </a>
        </p>
      </div>
    </div>
  )
}
