import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan'
    return Promise.reject(new Error(message))
  }
)

export const karyawanApi = {
  list: (params?: Record<string, unknown>) => api.get('/karyawan', { params }),
  detail: (id: number) => api.get(`/karyawan/${id}`),
  create: (data: FormData) => api.post('/karyawan', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: number, data: FormData) => api.post(`/karyawan/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: number) => api.delete(`/karyawan/${id}`),
  toggleStatus: (id: number) => api.patch(`/karyawan/${id}/toggle-status`),
  toggleKhusus: (id: number) => api.patch(`/karyawan/${id}/toggle-khusus`),
}

export const divisiApi = {
  list: () => api.get('/divisi'),
  create: (data: Record<string, unknown>) => api.post('/divisi', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/divisi/${id}`, data),
  delete: (id: number) => api.delete(`/divisi/${id}`),
}

export const cabangApi = {
  list: () => api.get('/cabang'),
  create: (data: Record<string, unknown>) => api.post('/cabang', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/cabang/${id}`, data),
  delete: (id: number) => api.delete(`/cabang/${id}`),
}

export const shiftApi = {
  list: () => api.get('/shift'),
  create: (data: Record<string, unknown>) => api.post('/shift', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/shift/${id}`, data),
  delete: (id: number) => api.delete(`/shift/${id}`),
}

export const shiftJadwalApi = {
  getJadwal: (userId: number, params?: Record<string, unknown>) => api.get(`/shift-jadwal/${userId}`, { params }),
  store: (data: Record<string, unknown>) => api.post('/shift-jadwal', data),
  storeMultiple: (data: Record<string, unknown>) => api.post('/shift-jadwal/multiple', data),
  delete: (id: number) => api.delete(`/shift-jadwal/${id}`),
}

export const rekapAbsensiApi = {
  get: (params?: Record<string, string>) => api.get('/rekap-absensi', { params }),
}

export const hariLiburApi = {
  list: () => api.get('/hari-libur'),
  store: (data: Record<string, string>) => api.post('/hari-libur', data),
  delete: (id: number) => api.delete(`/hari-libur/${id}`),
}

export const lemburApi = {
  list: (params?: Record<string, unknown>) => api.get('/lembur', { params }),
  updateStatus: (id: number, data: { status: string }) => api.post(`/lembur/${id}/status`, data),
  aktif: () => api.get('/lembur/aktif'),
  saya: () => api.get('/lembur/saya'),
  store: (data: FormData) => api.post('/lembur/store', data),
}

export const izinApi = {
  list: (params?: Record<string, unknown>) => api.get('/izin', { params }),
  store: (data: FormData) => api.post('/izin', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve: (id: number) => api.post(`/izin/${id}/approve`),
  reject: (id: number, data?: Record<string, unknown>) => api.post(`/izin/${id}/reject`, data || {}),
}

export const kehadiranKhususApi = {
  list: (params?: Record<string, unknown>) => api.get('/kehadiran-khusus', { params }),
  updateStatus: (data: { id: number; status: string }) => api.post('/kehadiran-khusus/update-status', data),
}

export const kehadiranApi = {
  list: (params?: Record<string, unknown>) => api.get('/kehadiran', { params }),
  updateStatus: (data: { id: number; status: string }) => api.post('/kehadiran/update-status', data),
}

export const userApi = {
  list: (params?: Record<string, unknown>) => api.get('/user', { params }),
  store: (data: Record<string, string>) => api.post('/user', data),
  update: (id: number, data: Record<string, string>) => api.put(`/user/${id}`, data),
  toggleStatus: (id: number) => api.patch(`/user/${id}/toggle-status`),
  delete: (id: number) => api.delete(`/user/${id}`),
}

export const referensiApi = {
  divisi: () => api.get('/divisi'),
  cabang: () => api.get('/cabang'),
  shiftAktif: () => api.get('/shift-aktif'),
}

export const kehadiranSenseiApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/kehadiran-sensei', { params }),
  getKelasByUser: (userId: number) =>
    api.get(`/kehadiran-sensei/kelas/${userId}`),
  updateStatus: (data: { id: number; status: string }) =>
    api.post('/kehadiran-sensei/update-status', data),
  getRiwayat: (userId: number, kelasId: number) =>
    api.get(`/kehadiran-sensei/riwayat/${userId}/${kelasId}`),
}

export const rekapKehadiranSenseiApi = {
  listSensei: () => api.get('/rekap-kehadiran-sensei'),
  getRekap: (userId: number, params?: Record<string, string | number>) =>
    api.get(`/rekap-kehadiran-sensei/${userId}`, { params }),
  updateStatus: (data: { id: number; status: string }) =>
    api.post('/rekap-kehadiran-sensei/update-status', data),
}

export const guruApi = {
  list: () => api.get('/guru'),
  store: (data: { user_ids: number[] }) => api.post('/guru', data),
  delete: (id: number) => api.delete(`/guru/${id}`),
}

export const agendaApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/data-agenda', { params }),
}

export const pembayaranApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get('/pembayaran', { params }),
}

export const monitoringLokasiApi = {
  get: (params?: Record<string, string>) =>
    api.get('/monitoring-lokasi', { params }),
}

export const rekapJadwalShiftApi = {
  getRekap: (userId: number, params?: Record<string, string | number>) =>
    api.get(`/rekap-jadwal-shift/${userId}`, { params }),
  updateStatus: (data: Record<string, unknown>) =>
    api.post('/rekap-jadwal-shift/update-status', data),
}

export const siswaApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get('/siswa', { params }),
  store: (data: FormData) => api.post('/siswa', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: number, data: FormData) => api.put(`/siswa/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  destroy: (id: number) => api.delete(`/siswa/${id}`),
  toggleStatus: (id: number) => api.post(`/siswa/${id}/toggle-status`),
  buatkanAkun: (id: number, data: { email: string; password: string }) =>
    api.post(`/siswa/${id}/buatkan-akun`, data),
  bulkDelete: (ids: number[]) => api.post('/siswa/bulk-delete', { ids }),
  bulkUpdateShift: (data: { shift_id: string; mode: string; ids?: number[] }) =>
    api.post('/siswa/bulk-update-shift', data),
  import: (data: FormData) => api.post('/siswa/import', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importAi: (data: FormData) => api.post('/siswa/import-ai', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const batchApi = {
  list: () => api.get('/batches'),
  store: (data: { nama_batch: string; cabang_id?: number | null }) => api.post('/batches', data),
  update: (id: number, data: { nama_batch: string; cabang_id?: number | null }) => api.put(`/batches/${id}`, data),
  destroy: (id: number) => api.delete(`/batches/${id}`),
  toggleStatus: (id: number) => api.post(`/batches/${id}/toggle-status`),
}

export const jadwalLevelApi = {
  list: () => api.get('/jadwal-level'),
  store: (data: { batch_id: number; level: number; tanggal_mulai: string; tanggal_selesai: string }) =>
    api.post('/jadwal-level', data),
  destroy: (batchId: number, level: number) => api.delete(`/jadwal-level/${batchId}/${level}`),
}

export const absensiSiswaApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get('/absensi-siswa', { params }),
  store: (data: Record<string, unknown>) => api.post('/absensi-siswa', data),
  massStore: (data: Record<string, unknown>) => api.post('/absensi-siswa/mass', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/absensi-siswa/${id}`, data),
  siswaByKelas: (kelasId: number) => api.get('/absensi-siswa/siswa-by-kelas', { params: { kelas_id: kelasId } }),
  cek: (siswaId: number, tanggal: string) =>
    api.get('/absensi-siswa/cek', { params: { siswa_id: siswaId, tanggal } }),
  rekap: (params?: Record<string, string | number | undefined>) =>
    api.get('/absensi-siswa/rekap', { params }),
}

export const aiChatApi = {
  send: (data: { message: string; history: { role: string; content: string }[] }) =>
    api.post('/ai-chat/send', data),
  ask: (message: string) =>
    api.post('/ai-chat/ask', { message }),
}

export const penilaianApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get('/penilaian', { params }),
  matrix: (params?: Record<string, string | number | undefined>) =>
    api.get('/penilaian/matrix', { params }),
  dayDetail: (params: Record<string, string | number | undefined>) =>
    api.get('/penilaian/day-detail', { params }),
  store: (data: Record<string, unknown>) => api.post('/penilaian', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/penilaian/${id}`, data),
  destroy: (id: number) => api.delete(`/penilaian/${id}`),
  storeStudentAssessment: (data: Record<string, unknown>) =>
    api.post('/penilaian/student-assessment/store', data),
  rekap: () => api.get('/penilaian/rekap'),
}

export const kelasSenseiApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get('/kelas-sensei', { params }),
  store: (data: Record<string, unknown>) => api.post('/kelas-sensei', data),
  destroy: (id: number) => api.delete(`/kelas-sensei/${id}`),
}

export const pengaturanShiftApi = {
  get: () => api.get('/pengaturan-shift'),
  update: (data: { shift_mode: string }) => api.post('/pengaturan-shift', data),
}

export const pengaturanWaApi = {
  get: () => api.get('/pengaturan-wa'),
  update: (data: { settings: Record<string, boolean> }) => api.post('/pengaturan-wa', data),
}

export const absensiKaryawanApi = {
  cek: () => api.get('/absensi-karyawan/cek'),
  masuk: (data?: Record<string, unknown>) => api.post('/absensi-karyawan/masuk', data || {}),
  pulang: (data?: Record<string, unknown>) => api.post('/absensi-karyawan/pulang', data || {}),
  riwayat: (params?: Record<string, string | number>) =>
    api.get('/absensi-karyawan/riwayat', { params }),
  statsHariIni: () => api.get('/absensi-karyawan/stats-hari-ini'),
  grafikMingguan: () => api.get('/absensi-karyawan/grafik-mingguan'),
  shiftSaya: () => api.get('/absensi-karyawan/shift-saya'),
  scanQr: (barcode: string, lat?: number, long?: number) => api.post('/absensi-karyawan/scan-qr', { barcode, lat, long }),
}

export const productApi = {
  list: () => api.get('/products'),
  store: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  destroy: (id: number) => api.delete(`/products/${id}`),
}

export const affiliateLinkApi = {
  list: (params?: Record<string, unknown>) => api.get('/affiliate-links', { params }),
  store: (data: Record<string, unknown>) => api.post('/affiliate-links', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/affiliate-links/${id}`, data),
  destroy: (id: number) => api.delete(`/affiliate-links/${id}`),
  getByKode: (kode: string) => api.get(`/affiliate-link/${kode}`),
  listAffiliates: () => api.get('/affiliates/list'),
}

export const pendaftarApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get('/pendaftar', { params }),
  show: (id: number) => api.get(`/pendaftar/${id}`),
  invoice: (id: number) => api.get(`/pendaftar/${id}/invoice`),
  approve: (id: number) => api.post(`/pendaftar/${id}/approve`),
  reject: (id: number) => api.post(`/pendaftar/${id}/reject`),
  verifyPayment: (id: number) => api.post(`/pendaftar/${id}/verify-payment`),
  riwayatPembayaran: (id: number) => api.get(`/pendaftar/${id}/riwayat-pembayaran`),
  destroy: (id: number) => api.delete(`/pendaftar/${id}`),
  daftar: (data: FormData) =>
    api.post('/pendaftaran/daftar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  daftarLangsung: (data: FormData) =>
    api.post('/pendaftaran/daftar-langsung', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  kandidat: (params?: Record<string, string>) =>
    api.get('/kandidat', { params }),
}

export const affiliateDashboardApi = {
  index: () => api.get('/affiliate-dashboard'),
}

export const couponApi = {
  list: () => api.get('/coupons'),
  store: (data: Record<string, unknown>) => api.post('/coupons', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/coupons/${id}`, data),
  destroy: (id: number) => api.delete(`/coupons/${id}`),
  validate: (data: { kode: string; product_id: number; nominal: number }) =>
    api.post('/coupons/validate', data),
}

export const authApi = {
  user: () => api.get('/auth/user'),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  registerAffiliate: (data: Record<string, unknown>) =>
    api.post('/auth/register-affiliate', data),
}

export const profileApi = {
  update: (data: FormData) => api.post('/profile/update', data),
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    api.post('/profile/password', data),
}

export const guruProfileApi = {
  profile: () => api.get('/guru/profile'),
}

export const guruKelasApi = {
  list: () => api.get('/guru/kelas-saya'),
  store: (data: Record<string, unknown>) => api.post('/guru/kelas-saya', data),
  cekAbsen: (kelasId: number) => api.get('/guru/absen-cek', { params: { kelas_id: kelasId } }),
  absenMasuk: (data: { kelas_id: number; foto?: string; lat?: number; long?: number }) =>
    api.post('/guru/absen-masuk', data),
  absenPulang: (data: { kelas_id: number; foto?: string; lat?: number; long?: number }) =>
    api.post('/guru/absen-pulang', data),
  dataSiswa: (kelasId: number) => api.get(`/guru/data-siswa/${kelasId}`),
  penilaianHarian: (kelasId: number) => api.get(`/guru/penilaian-harian/${kelasId}`),
  simpanPenilaianHarian: (data: { siswa_id: number; kelas_sensei_id: number; tanggal: string; is_terisi: boolean; catatan?: string; scores?: { component_id: number; nilai: number | null }[] }) =>
    api.post('/guru/penilaian-harian', data),
}

export default api
