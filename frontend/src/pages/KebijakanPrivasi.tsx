import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const sections = [
  {
    title: '1. Informasi yang Kami Kumpulkan',
    items: [
      'Kami mengumpulkan data yang Anda berikan saat pendaftaran, seperti nama, email, nomor telepon, alamat, dan dokumen pendukung yang diperlukan.',
      'Kami juga mengumpulkan data penggunaan layanan secara otomatis, seperti aktivitas, perangkat, dan log transaksi untuk keperluan operasional.',
      'Data pembayaran seperti bukti transfer dan nomor rekening dikumpulkan untuk keperluan verifikasi transaksi.',
    ],
  },
  {
    title: '2. Penggunaan Data',
    items: [
      'Data digunakan untuk memproses pendaftaran, verifikasi pembayaran, dan pemberian akses layanan.',
      'Data digunakan untuk keperluan komunikasi, informasi program, dan peningkatan kualitas layanan.',
      'Data digunakan untuk memenuhi kewajiban hukum dan peraturan yang berlaku di Indonesia.',
    ],
  },
  {
    title: '3. Penyimpanan & Keamanan Data',
    items: [
      'Data pribadi Anda disimpan secara aman pada sistem kami dan dilindungi dengan prosedur keamanan yang memadai.',
      'Akses terhadap data pribadi hanya diberikan kepada pihak yang memiliki kewenangan dan keperluan.',
      'Kami berkomitmen untuk melindungi data Anda dari akses, penggunaan, atau pengungkapan tanpa izin.',
    ],
  },
  {
    title: '4. Pembagian Data kepada Pihak Ketiga',
    items: [
      'Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak mana pun.',
      'Data hanya dapat dibagikan kepada pihak ketiga apabila diwajibkan oleh hukum atau peraturan yang berlaku.',
      'Pihak mitra yang bekerja sama dengan kami wajib menjaga kerahasiaan data sesuai kebijakan ini.',
    ],
  },
  {
    title: '5. Hak Anda atas Data',
    items: [
      'Anda berhak mengakses, memperbarui, atau mengoreksi data pribadi Anda.',
      'Anda dapat mengajukan permintaan penghapusan data sesuai ketentuan peraturan perundang-undangan.',
      'Anda dapat menghubungi kami untuk pertanyaan atau keluhan terkait pengelolaan data pribadi Anda.',
    ],
  },
  {
    title: '6. Cookie & Teknologi Pelacakan',
    items: [
      'Kami dapat menggunakan cookie untuk meningkatkan pengalaman penggunaan layanan.',
      'Anda dapat mengatur atau menonaktifkan cookie melalui pengaturan peramban yang digunakan.',
    ],
  },
  {
    title: '7. Perubahan Kebijakan',
    items: [
      'Kebijakan Privasi ini dapat diperbarui sewaktu-waktu untuk menyesuaikan dengan perkembangan layanan dan peraturan.',
      'Perubahan kebijakan akan diumumkan melalui laman ini tanpa pemberitahuan khusus.',
    ],
  },
  {
    title: '8. Hubungi Kami',
    items: [
      'Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi kami melalui kontak yang tersedia di website.',
      'Kami akan menanggapi setiap pertanyaan atau keluhan terkait data pribadi secepatnya.',
    ],
  },
]

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-sm.png" alt="Mendunia" className="w-6 md:w-7 h-6 md:h-7" />
            <span className="text-base md:text-xl font-bold text-gray-900 tracking-tight">Mendunia.id</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#f8f9fc] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#0E6187]" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Kebijakan Privasi</h1>
                <p className="text-xs text-gray-500 mt-0.5">Terakhir diperbarui: 14 Juli 2026</p>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-8 py-6 md:py-8 space-y-6">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-sm font-bold text-gray-900 mb-2">{section.title}</h2>
                <ul className="space-y-1.5">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-sm text-gray-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="px-6 md:px-8 py-5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400 text-center">
              &copy; 2026 PT Mendunia Indonesia. Seluruh hak dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
