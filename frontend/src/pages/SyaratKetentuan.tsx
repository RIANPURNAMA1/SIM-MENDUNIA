import { ArrowLeft, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const sections = [
  {
    title: '1. Umum',
    items: [
      'Sistem Informasi Mendunia (SIM Mendunia) adalah platform manajemen SDM yang dikelola oleh PT Mendunia Indonesia.',
      'Dengan mendaftar dan menggunakan layanan ini, Pengguna menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.',
      'Perubahan terhadap syarat dan ketentuan ini dapat dilakukan sewaktu-waktu tanpa pemberitahuan terlebih dahulu.',
    ],
  },
  {
    title: '2. Pendaftaran',
    items: [
      'Pengguna wajib mengisi data diri dengan lengkap, benar, dan valid pada saat pendaftaran.',
      'Setiap pengguna hanya diperkenankan memiliki satu akun. Penggunaan akun ganda tidak diperbolehkan.',
      'Pengguna bertanggung jawab atas kerahasiaan akun dan kata sandi masing-masing.',
      'Pengguna wajib segera memberitahukan pihak SIM Mendunia apabila terjadi penyalahgunaan akun.',
    ],
  },
  {
    title: '3. Pembayaran',
    items: [
      'Pembayaran pendaftaran program wajib dilakukan sesuai nominal dan tahapan yang telah ditentukan.',
      'Bukti pembayaran yang diunggah harus asli, jelas, dan valid.',
      'Verifikasi pembayaran dilakukan oleh admin dalam waktu 1×24 jam hari kerja.',
      'Pembayaran yang telah diverifikasi tidak dapat dikembalikan (non-refundable), kecuali dengan keputusan khusus dari manajemen.',
      'Pengguna bertanggung jawab atas kebenaran data transaksi yang dikirimkan.',
    ],
  },
  {
    title: '4. Hak & Kewajiban Pengguna',
    items: [
      'Pengguna berhak mendapatkan akses penuh ke layanan setelah pembayaran terverifikasi.',
      'Pengguna wajib mematuhi seluruh peraturan dan kebijakan yang berlaku di SIM Mendunia.',
      'Pengguna dilarang melakukan penyalahgunaan data, sistem, atau layanan dalam bentuk apapun.',
      'Pengguna bertanggung jawab penuh atas aktivitas yang dilakukan melalui akunnya.',
    ],
  },
  {
    title: '5. Hak & Kewajiban Pihak Mendunia',
    items: [
      'Mendunia berhak melakukan perubahan, pembaruan, atau penghentian layanan sewaktu-waktu.',
      'Mendunia berhak menolak atau membatalkan pendaftaran yang dianggap melanggar ketentuan.',
      'Mendunia wajib menjaga kerahasiaan data pribadi Pengguna sesuai kebijakan privasi yang berlaku.',
      'Mendunia bertanggung jawab memproses dan memverifikasi pembayaran secara transparan.',
    ],
  },
  {
    title: '6. Pembatalan & Pengembalian Dana',
    items: [
      'Pembatalan pendaftaran hanya dapat dilakukan sebelum status pembayaran diverifikasi.',
      'Pengembalian dana (refund) hanya berlaku dalam kondisi tertentu yang ditetapkan oleh manajemen.',
      'Proses pengembalian dana akan diproses dalam waktu 7–14 hari kerja.',
    ],
  },
  {
    title: '7. Privasi & Perlindungan Data',
    items: [
      'Data pribadi Pengguna akan diolah dan disimpan sesuai peraturan perundang-undangan yang berlaku di Indonesia.',
      'Data tidak akan disebarluaskan kepada pihak ketiga tanpa persetujuan Pengguna, kecuali diwajibkan oleh hukum.',
    ],
  },
  {
    title: '8. Penyelesaian Sengketa',
    items: [
      'Setiap perselisihan akan diselesaikan terlebih dahulu melalui musyawarah dan mufakat.',
      'Apabila tidak tercapai kesepakatan, sengketa akan diselesaikan melalui pengadilan yang berwenang di wilayah hukum Indonesia.',
    ],
  },
]

export default function SyaratKetentuan() {
  const navigate = useNavigate()
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
                <Shield size={20} className="text-[#0E6187]" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Syarat & Ketentuan</h1>
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
