import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import AffiliateLayout from './layouts/AffiliateLayout'
import Login from './pages/Login'
import DashboardHome from './pages/Dashboard/DashboardHome'
import Dashboard from './pages/Dashboard/Dashboard'
import DashboardAkademik from './pages/Akademik/DashboardAkademik'
import DashboardKandidat from './pages/Dashboard/DashboardKandidat'
import Karyawan from './pages/Karyawan/Karyawan'
import Divisi from './pages/Karyawan/Divisi'
import Cabang from './pages/Karyawan/Cabang'
import Shift from './pages/Karyawan/Shift'
import JadwalShift from './pages/Karyawan/JadwalShift'
import DaftarUser from './pages/Karyawan/DaftarUser'
import DataKehadiran from './pages/Absensi/DataKehadiran'
import DataKehadiranKhusus from './pages/Absensi/DataKehadiranKhusus'
import IzinCuti from './pages/Karyawan/IzinCuti'
import ApprovalLembur from './pages/Karyawan/ApprovalLembur'
import HariLibur from './pages/Karyawan/HariLibur'
import RekapAbsensi from './pages/Absensi/RekapAbsensi'
import RekapJadwalShift from './pages/Karyawan/RekapJadwalShift'
import MonitoringLokasi from './pages/Karyawan/MonitoringLokasi'
import DataAgenda from './pages/Akademik/DataAgenda'
import Guru from './pages/Sensei/Guru'
import RekapKehadiranSensei from './pages/Absensi/RekapKehadiranSensei'
import DataKehadiranSensei from './pages/Absensi/DataKehadiranSensei'
import KelasSensei from './pages/Sensei/KelasSensei'
import JadwalLevel from './pages/Sensei/JadwalLevel'
import Siswa from './pages/Siswa/Siswa'
import Batches from './pages/Siswa/Batches'
import AbsensiSiswa from './pages/Absensi/AbsensiSiswa'
import AbsensiKaryawan from './pages/Absensi/AbsensiKaryawan'
import RekapSiswa from './pages/Siswa/RekapSiswa'
import Penilaian from './pages/Siswa/Penilaian'
import AiChat from './pages/AiChat'
import Pengaturan from './pages/Pengaturan/Pengaturan'
import PengaturanShift from './pages/Karyawan/PengaturanShift'
import PengaturanWa from './pages/Pengaturan/PengaturanWa'
import DataKandidat from './pages/Pendaftaran/DataKandidat'
import Pendaftar from './pages/Pendaftaran/Pendaftar'
import DataMatchingJob from './pages/Akademik/DataMatchingJob'
import Tagihan from './pages/Siswa/Tagihan'
import Pembayaran from './pages/Siswa/Pembayaran'
import DataAffiliate from './pages/Affiliate/DataAffiliate'
import DataProduct from './pages/Affiliate/DataProduct'
import DataCoupon from './pages/Affiliate/DataCoupon'
import DaftarAffiliate from './pages/Pendaftaran/DaftarAffiliate'
import AffiliateDashboard from './pages/Affiliate/AffiliateDashboard'
import DaftarAffiliateBaru from './pages/Pendaftaran/DaftarAffiliateBaru'
import DaftarProgram from './pages/Pendaftaran/DaftarProgram'
import KaryawanDashboard from './pages/Karyawan/KaryawanDashboard'
import RiwayatAbsensiKaryawan from './pages/Karyawan/RiwayatAbsensiKaryawan'
import PengajuanIzin from './pages/Karyawan/PengajuanIzin'
import LemburKaryawan from './pages/Karyawan/LemburKaryawan'
import JadwalKaryawan from './pages/Karyawan/JadwalKaryawan'
import ProfilKaryawan from './pages/Karyawan/ProfilKaryawan'
import SiswaDashboard from './pages/SiswaDashboard'
import SiswaLayout from './layouts/SiswaLayout'
import PembayaranSiswa from './pages/Siswa/PembayaranSiswa'
import AbsensiSaya from './pages/Absensi/AbsensiSaya'
import LMS from './pages/Akademik/LMS'
import DashboardManagement from './pages/Dashboard/DashboardManagement'
import GuruDashboard from './pages/Guru/GuruDashboard'
import GuruLayout from './layouts/GuruLayout'

function AccessDenied({ role }: { role: string }) {
  const map: Record<string, { link: string; label: string }> = {
    AFFILIATE: { link: '/affiliate-dashboard', label: 'Dashboard Affiliate' },
    KANDIDAT: { link: '/siswa-dashboard', label: 'Dashboard Pendaftaran' },
    KARYAWAN: { link: '/dashboard-karyawan', label: 'Dashboard Karyawan' },
    GURU: { link: '/guru-dashboard', label: 'Dashboard Guru' },
  }
  const info = map[role] || { link: '/login', label: 'Dashboard' }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6">
          Halaman ini hanya untuk administrator. Silakan gunakan menu yang tersedia di {info.label.toLowerCase()} Anda.
        </p>
        <a
          href={info.link}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke {info.label}
        </a>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, roleAllowed, roleBlocked }: { children: React.ReactNode; roleAllowed?: string; roleBlocked?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roleAllowed && user?.role !== roleAllowed) {
    return <AccessDenied role={roleAllowed} />
  }

  if (roleBlocked && user?.role && roleBlocked.includes(user.role)) {
    return <AccessDenied role={user.role} />
  }

  if (!roleAllowed && !roleBlocked && (user?.role === 'AFFILIATE' || user?.role === 'KANDIDAT')) {
    return <AccessDenied role={user.role} />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/daftar/:kode" element={<DaftarAffiliate />} />
      <Route path="/daftar-affiliate" element={<DaftarAffiliateBaru />} />
      <Route path="/daftar-program" element={<DaftarProgram />} />
      <Route path="/daftar-program/:id" element={<DaftarProgram />} />

      <Route
        path="/affiliate-dashboard"
        element={
          <ProtectedRoute roleAllowed="AFFILIATE">
            <AffiliateLayout>
              <AffiliateDashboard />
            </AffiliateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/siswa-dashboard"
        element={
          <ProtectedRoute roleAllowed="KANDIDAT">
            <SiswaLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SiswaDashboard />} />
        <Route path="absensi" element={<AbsensiSaya />} />
        <Route path="pembayaran" element={<PembayaranSiswa />} />
        <Route path="lms" element={<LMS />} />
      </Route>

      <Route
        path="/guru-dashboard"
        element={
          <ProtectedRoute roleAllowed="GURU">
            <GuruLayout>
              <GuruDashboard />
            </GuruLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <KaryawanDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/riwayat-absensi-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <RiwayatAbsensiKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pengajuan-izin"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <PengajuanIzin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lembur-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <LemburKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jadwal-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <JadwalKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profil-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN']}>
            <ProfilKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute roleBlocked={['KARYAWAN']}>
            <DashboardLayout>
              <Routes>
                <Route path="/dashboard-absensi" element={<Dashboard />} />
                <Route path="/" element={<DashboardHome />} />
                <Route path="/dashboard-akademik" element={<DashboardAkademik />} />
                <Route path="/dashboard-kandidat" element={<DashboardKandidat />} />
                <Route path="/dashboard-management" element={<DashboardManagement />} />
                <Route path="/karyawan" element={<Karyawan />} />
                <Route path="/divisi" element={<Divisi />} />
                <Route path="/cabang" element={<Cabang />} />
                <Route path="/shift" element={<Shift />} />
                <Route path="/jadwal-shift" element={<JadwalShift />} />
                <Route path="/daftar-user" element={<DaftarUser />} />
                <Route path="/data-kehadiran" element={<DataKehadiran />} />
                <Route path="/data-kehadiran-khusus" element={<DataKehadiranKhusus />} />
                <Route path="/izin-cuti" element={<IzinCuti />} />
                <Route path="/approval-lembur" element={<ApprovalLembur />} />
                <Route path="/hari-libur" element={<HariLibur />} />
                <Route path="/rekap-absensi" element={<RekapAbsensi />} />
                <Route path="/rekap-jadwal-shift" element={<RekapJadwalShift />} />
                <Route path="/monitoring-lokasi" element={<MonitoringLokasi />} />
                <Route path="/data-agenda" element={<DataAgenda />} />
                <Route path="/guru" element={<Guru />} />
                <Route path="/rekap-kehadiran-sensei" element={<RekapKehadiranSensei />} />
                <Route path="/data-kehadiran-sensei" element={<DataKehadiranSensei />} />
                <Route path="/kelas-sensei" element={<KelasSensei />} />
                <Route path="/jadwal-level" element={<JadwalLevel />} />
                <Route path="/siswa" element={<Siswa />} />
                <Route path="/batches" element={<Batches />} />
                <Route path="/absensi" element={<AbsensiKaryawan />} />
                <Route path="/absensi-siswa" element={<AbsensiSiswa />} />
                <Route path="/rekap-siswa" element={<RekapSiswa />} />
                <Route path="/penilaian" element={<Penilaian />} />
                <Route path="/ai-chat" element={<AiChat />} />
                <Route path="/pengaturan" element={<Pengaturan />} />
                <Route path="/pengaturan-shift" element={<PengaturanShift />} />
                <Route path="/pengaturan-wa" element={<PengaturanWa />} />
                <Route path="/data-kandidat" element={<DataKandidat />} />
                <Route path="/pendaftar" element={<Pendaftar />} />
                <Route path="/data-matching-job" element={<DataMatchingJob />} />
                <Route path="/tagihan" element={<Tagihan />} />
                <Route path="/pembayaran" element={<Pembayaran />} />
                <Route path="/data-affiliate" element={<DataAffiliate />} />
                <Route path="/data-product" element={<DataProduct />} />
                <Route path="/data-coupon" element={<DataCoupon />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App(): React.ReactNode {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
