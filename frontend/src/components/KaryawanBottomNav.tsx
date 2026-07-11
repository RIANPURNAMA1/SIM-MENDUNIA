import { Home, Calendar, Camera, CheckCircle, BarChart3, User } from 'lucide-react'
import Swal from 'sweetalert2'

interface Props {
  activeTab: string
  absenStatus?: 'belum' | 'masuk' | 'pulang'
  hasJadwal?: boolean
  onAbsenClick?: () => void
  homeHref?: string
  jadwalHref?: string
  laporanHref?: string
  profilHref?: string
}

export default function KaryawanBottomNav({
  activeTab, absenStatus, hasJadwal = true, onAbsenClick,
  homeHref = '/dashboard-karyawan',
  jadwalHref = '/jadwal-karyawan',
  laporanHref = '/riwayat-absensi-karyawan',
  profilHref = '/profil-karyawan',
}: Props) {
  const handleAbsen = () => {
    if (!hasJadwal) {
      Swal.fire({ icon: 'warning', title: 'Tidak Ada Jadwal', text: 'Tidak ada jadwal shift hari ini, absensi tidak dapat dilakukan' })
      return
    }
    onAbsenClick?.()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EF] z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        <a href={homeHref}
          className={`relative flex flex-col items-center gap-1 py-2.5 px-3 flex-1 ${activeTab === 'home' ? 'text-[#0069b0]' : 'text-[#A5AAB8]'}`}>
          {activeTab === 'home' && <span className="absolute top-0 w-6 h-[2px] bg-[#0069b0] rounded-full" />}
          <Home size={19} strokeWidth={activeTab === 'home' ? 2.2 : 1.8} />
          <span className={`text-[10px] ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>Home</span>
        </a>
        <a href={jadwalHref}
          className={`relative flex flex-col items-center gap-1 py-2.5 px-3 flex-1 ${activeTab === 'jadwal' ? 'text-[#0069b0]' : 'text-[#A5AAB8]'}`}>
          {activeTab === 'jadwal' && <span className="absolute top-0 w-6 h-[2px] bg-[#0069b0] rounded-full" />}
          <Calendar size={19} strokeWidth={activeTab === 'jadwal' ? 2.2 : 1.8} />
          <span className={`text-[10px] ${activeTab === 'jadwal' ? 'font-bold' : 'font-medium'}`}>Jadwal</span>
        </a>

        {/* Absen - Tombol Mencolok */}
        <div className="relative -mt-5 px-3">
          <button
            onClick={handleAbsen}
            disabled={absenStatus === 'pulang'}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0069b0] text-white shadow-lg shadow-[#0069b0]/30 hover:bg-[#1a2d4a] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
            {absenStatus === 'pulang' ? (
              <CheckCircle size={22} className="text-white" />
            ) : (
              <Camera size={22} />
            )}
          </button>
          <span className={`block text-[10px] text-center font-semibold mt-0.5 ${absenStatus === 'pulang' ? 'text-emerald-600' : 'text-[#0069b0]'}`}>
            {absenStatus === 'pulang' ? 'Selesai' : absenStatus === 'masuk' ? 'Pulang' : 'Absen'}
          </span>
        </div>

        <a href={laporanHref}
          className={`relative flex flex-col items-center gap-1 py-2.5 px-3 flex-1 ${activeTab === 'laporan' ? 'text-[#0069b0]' : 'text-[#A5AAB8]'}`}>
          {activeTab === 'laporan' && <span className="absolute top-0 w-6 h-[2px] bg-[#0069b0] rounded-full" />}
          <BarChart3 size={19} strokeWidth={activeTab === 'laporan' ? 2.2 : 1.8} />
          <span className={`text-[10px] ${activeTab === 'laporan' ? 'font-bold' : 'font-medium'}`}>Laporan</span>
        </a>
        <a href={profilHref}
          className={`relative flex flex-col items-center gap-1 py-2.5 px-3 flex-1 ${activeTab === 'profil' ? 'text-[#0069b0]' : 'text-[#A5AAB8]'}`}>
          {activeTab === 'profil' && <span className="absolute top-0 w-6 h-[2px] bg-[#0069b0] rounded-full" />}
          <User size={19} strokeWidth={activeTab === 'profil' ? 2.2 : 1.8} />
          <span className={`text-[10px] ${activeTab === 'profil' ? 'font-bold' : 'font-medium'}`}>Profil</span>
        </a>
      </div>
    </div>
  )
}
