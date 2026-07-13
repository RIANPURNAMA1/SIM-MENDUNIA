import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import AffiliateLayout from './layouts/AffiliateLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import DashboardHome from './pages/Dashboard/DashboardHome'
import DashboardAbsensi from './pages/Absensi/DashboardAbsensi'
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
import AbsensiGuruShift from './pages/Absensi/AbsensiGuruShift'
import AbsensiGuruCabang from './pages/Absensi/AbsensiGuruCabang'
import RekapSiswa from './pages/Siswa/RekapSiswa'
import Penilaian from './pages/Siswa/Penilaian'
import AiChat from './pages/AiChat'
import Pengaturan from './pages/Pengaturan/Pengaturan'
import PengaturanShift from './pages/Karyawan/PengaturanShift'
import PengaturanWa from './pages/Pengaturan/PengaturanWa'
import CompanyProfile from './pages/Pengaturan/CompanyProfile'
import DataKandidat from './pages/Pendaftaran/DataKandidat'
import Pendaftar from './pages/Pendaftaran/Pendaftar'
import InvoicePendaftar from './pages/Pendaftaran/InvoicePendaftar'
import DataMatchingJob from './pages/Akademik/DataMatchingJob'
import Tagihan from './pages/Siswa/Tagihan'
import RekapBatch from './pages/Siswa/RekapBatch'
import Pembayaran from './pages/Siswa/Pembayaran'
import DataDiri from './pages/Siswa/DataDiri'
import DataAffiliate from './pages/Affiliate/DataAffiliate'
import DataProduct from './pages/Affiliate/DataProduct'
import DataCoupon from './pages/Affiliate/DataCoupon'
import DataBiayaKategori from './pages/Affiliate/DataBiayaKategori'
import DataKategoriPengeluaran from './pages/Keuangan/DataKategoriPengeluaran'
import DataPengeluaran from './pages/Keuangan/DataPengeluaran'
import DashboardKeuangan from './pages/Keuangan/DashboardKeuangan'
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
import DataCourse from './pages/Akademik/DataCourse'
import DataLesson from './pages/Akademik/DataLesson'
import DashboardManagement from './pages/Dashboard/DashboardManagement'
import GuruDashboard from './pages/Guru/GuruDashboard'
import GuruDataSiswa from './pages/Guru/GuruDataSiswa'
import GuruProfil from './pages/Guru/GuruProfil'

import GuruLayout from './layouts/GuruLayout'
import AdminCabangLayout from './layouts/AdminCabangLayout'
import AdminCabangDashboard from './pages/AdminCabang/AdminCabangDashboard'
import AdminCabangTagihan from './pages/AdminCabang/AdminCabangTagihan'
import AdminCabangDataKandidat from './pages/AdminCabang/AdminCabangDataKandidat'
import AdminCabangPendaftaran from './pages/AdminCabang/AdminCabangPendaftaran'

function ProtectedRoute({ children, roleAllowed, roleBlocked }: { children: React.ReactNode; roleAllowed?: string; roleBlocked?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roleAllowed && user?.role !== roleAllowed) {
    const map: Record<string, string> = {
      AFFILIATE: '/affiliate-dashboard',
      KANDIDAT: '/siswa-dashboard',
      KARYAWAN: '/dashboard-karyawan',
      GURU: '/guru-dashboard',
      ADMIN_CABANG: '/admin-cabang',
    }
    return <Navigate to={map[user?.role || ''] || '/login'} replace />
  }

  if (roleBlocked && user?.role && roleBlocked.includes(user.role)) {
    const map: Record<string, string> = {
      AFFILIATE: '/affiliate-dashboard',
      KANDIDAT: '/siswa-dashboard',
      KARYAWAN: '/dashboard-karyawan',
      GURU: '/guru-dashboard',
      ADMIN_CABANG: '/admin-cabang',
    }
    return <Navigate to={map[user.role] || '/login'} replace />
  }

  if (!roleAllowed && !roleBlocked && (user?.role === 'AFFILIATE' || user?.role === 'KANDIDAT')) {
    const map: Record<string, string> = {
      AFFILIATE: '/affiliate-dashboard',
      KANDIDAT: '/siswa-dashboard',
    }
    return <Navigate to={map[user?.role || ''] || '/login'} replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
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
        <Route path="data-diri" element={<DataDiri />} />
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
        path="/guru-data-siswa"
        element={
          <ProtectedRoute roleAllowed="GURU">
            <GuruLayout>
              <GuruDataSiswa />
            </GuruLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/guru-profil"
        element={
          <ProtectedRoute roleAllowed="GURU">
            <GuruLayout>
              <GuruProfil />
            </GuruLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <KaryawanDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-cabang"
        element={
          <ProtectedRoute roleAllowed="ADMIN_CABANG">
            <AdminCabangLayout>
              <AdminCabangDashboard />
            </AdminCabangLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-cabang/tagihan"
        element={
          <ProtectedRoute roleAllowed="ADMIN_CABANG">
            <AdminCabangLayout>
              <AdminCabangTagihan />
            </AdminCabangLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-cabang/kandidat"
        element={
          <ProtectedRoute roleAllowed="ADMIN_CABANG">
            <AdminCabangLayout>
              <AdminCabangDataKandidat />
            </AdminCabangLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-cabang/pendaftar"
        element={
          <ProtectedRoute roleAllowed="ADMIN_CABANG">
            <AdminCabangLayout>
              <AdminCabangPendaftaran />
            </AdminCabangLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-cabang/rekap-per-batch"
        element={
          <ProtectedRoute roleAllowed="ADMIN_CABANG">
            <AdminCabangLayout>
              <RekapBatch />
            </AdminCabangLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/riwayat-absensi-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <RiwayatAbsensiKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pengajuan-izin"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <PengajuanIzin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lembur-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <LemburKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jadwal-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <JadwalKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profil-karyawan"
        element={
          <ProtectedRoute roleBlocked={['MANAGER', 'HR', 'ADMIN', 'GURU']}>
            <ProfilKaryawan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute roleBlocked={['KARYAWAN', 'GURU', 'KANDIDAT', 'AFFILIATE', 'ADMIN_CABANG']}>
            <DashboardLayout>
              <Routes>
                <Route path="/dashboard-absensi" element={<DashboardAbsensi />} />
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
                <Route path="/absensi-guru-shift" element={<AbsensiGuruShift />} />
                <Route path="/absensi-guru-cabang" element={<AbsensiGuruCabang />} />
                <Route path="/rekap-siswa" element={<RekapSiswa />} />
                <Route path="/penilaian" element={<Penilaian />} />
                <Route path="/lms" element={<DataCourse />} />
                <Route path="/lms/:courseId/lessons" element={<DataLesson />} />
                <Route path="/ai-chat" element={<AiChat />} />
                <Route path="/pengaturan" element={<Pengaturan />} />
                <Route path="/pengaturan-shift" element={<PengaturanShift />} />
                <Route path="/pengaturan-wa" element={<PengaturanWa />} />
                <Route path="/pengaturan-perusahaan" element={<CompanyProfile />} />
                <Route path="/data-kandidat" element={<DataKandidat />} />
                <Route path="/pendaftar" element={<Pendaftar />} />
                <Route path="/pendaftar/:id/invoice" element={<InvoicePendaftar />} />
                <Route path="/data-matching-job" element={<DataMatchingJob />} />
                <Route path="/tagihan" element={<Tagihan />} />
                <Route path="/rekap-per-batch" element={<RekapBatch />} />
                <Route path="/pembayaran" element={<Pembayaran />} />
                <Route path="/data-affiliate" element={<DataAffiliate />} />
                <Route path="/data-product" element={<DataProduct />} />
                <Route path="/data-coupon" element={<DataCoupon />} />
                <Route path="/data-biaya-kategori" element={<DataBiayaKategori />} />
                <Route path="/dashboard-keuangan" element={<DashboardKeuangan />} />
                <Route path="/kategori-pengeluaran" element={<DataKategoriPengeluaran />} />
                <Route path="/pengeluaran" element={<DataPengeluaran />} />
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
