import { BookOpen } from 'lucide-react'

export default function LMS() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">LMS</h1>
        <p className="text-sm text-gray-500 mt-1">Learning Management System</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Fitur LMS Segera Hadir</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Halaman Learning Management System masih dalam pengembangan. Silakan cek kembali nanti.
        </p>
      </div>
    </div>
  )
}
