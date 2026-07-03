import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import Dashboard from './pages/Dashboard'
import DashboardAkademik from './pages/DashboardAkademik'
import DashboardKandidat from './pages/DashboardKandidat'
import Karyawan from './pages/Karyawan'
import Divisi from './pages/Divisi'
import Cabang from './pages/Cabang'
import Shift from './pages/Shift'
import JadwalShift from './pages/JadwalShift'
import DaftarUser from './pages/DaftarUser'
import DataKehadiran from './pages/DataKehadiran'
import DataKehadiranKhusus from './pages/DataKehadiranKhusus'
import IzinCuti from './pages/IzinCuti'
import ApprovalLembur from './pages/ApprovalLembur'
import HariLibur from './pages/HariLibur'
import RekapAbsensi from './pages/RekapAbsensi'
import RekapJadwalShift from './pages/RekapJadwalShift'
import MonitoringLokasi from './pages/MonitoringLokasi'
import DataAgenda from './pages/DataAgenda'
import Guru from './pages/Guru'
import RekapKehadiranSensei from './pages/RekapKehadiranSensei'
import DataKehadiranSensei from './pages/DataKehadiranSensei'
import KelasSensei from './pages/KelasSensei'
import JadwalLevel from './pages/JadwalLevel'
import Siswa from './pages/Siswa'
import Batches from './pages/Batches'
import AbsensiSiswa from './pages/AbsensiSiswa'
import RekapSiswa from './pages/RekapSiswa'
import Penilaian from './pages/Penilaian'
import AiChat from './pages/AiChat'
import Pengaturan from './pages/Pengaturan'
import PengaturanShift from './pages/PengaturanShift'
import PengaturanWa from './pages/PengaturanWa'
import DataKandidat from './pages/DataKandidat'
import Pendaftar from './pages/Pendaftar'
import DataMatchingJob from './pages/DataMatchingJob'
import Tagihan from './pages/Tagihan'
import Pembayaran from './pages/Pembayaran'
import DataAffiliate from './pages/DataAffiliate'
import DataProduct from './pages/DataProduct'

export default function App(): React.ReactNode {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard-home" element={<DashboardHome />} />
          <Route path="/dashboard-akademik" element={<DashboardAkademik />} />
          <Route path="/dashboard-kandidat" element={<DashboardKandidat />} />
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
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}
