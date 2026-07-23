import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string }>) => {
    const url = error.config?.url || ''
    const isLoginRequest = url.includes('/login')
    const isUserCheck = url.includes('/auth/user')
    const isLogoutRequest = url.includes('/auth/logout')
    if (error.response?.status === 401 && !isLoginRequest && !isUserCheck && !isLogoutRequest) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
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
  tableData: () => api.get('/rekap-kehadiran-sensei/table-data'),
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
  update: (id: number, data: FormData) => api.post(`/siswa/${id}`, data, {
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
  store: (data: { nama_batch: string; cabang_id?: number | null; kuota?: number | null }) => api.post('/batches', data),
  update: (id: number, data: { nama_batch: string; cabang_id?: number | null; kuota?: number | null }) => api.put(`/batches/${id}`, data),
  destroy: (id: number) => api.delete(`/batches/${id}`),
  toggleStatus: (id: number) => api.post(`/batches/${id}/toggle-status`),
  togglePenuh: (id: number) => api.post(`/batches/${id}/toggle-penuh`),
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
  kalender: (siswaId: number, params?: { month?: number; year?: number }) =>
    api.get(`/absensi-siswa/${siswaId}/kalender`, { params }),
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

export const companyProfileApi = {
  get: () => api.get('/company-profile'),
  update: (data: FormData) => api.post('/company-profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
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
  detail: (id: number) => api.get(`/affiliates/${id}/detail`),
  myStore: (data: { product_id: number; nama_link?: string }) => api.post('/affiliate/my-links', data),
  availableProducts: () => api.get('/affiliate/products-aktif'),
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
  createKandidat: (data: Record<string, unknown>) =>
    api.post('/kandidat', data),
  updateKandidat: (id: number, data: Record<string, unknown>) =>
    api.put(`/kandidat/${id}`, data),
  toggleKandidatStatus: (id: number) =>
    api.post(`/kandidat/${id}/toggle-status`),
  toggleKandidatCuti: (id: number) =>
    api.post(`/kandidat/${id}/toggle-cuti`),
  bayarInfo: (id: number) => api.get(`/pendaftaran/bayar/${id}`),
  bayar: (id: number, data: FormData) =>
    api.post(`/pendaftar/${id}/bayar`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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

export const adminCabangApi = {
  dashboard: () => api.get('/admin-cabang/dashboard'),
  pendaftar: (params?: Record<string, string | undefined>) =>
    api.get('/admin-cabang/pendaftar', { params }),
  tagihan: (params?: Record<string, string | undefined>) =>
    api.get('/admin-cabang/tagihan', { params }),
  kandidat: (params?: Record<string, string>) =>
    api.get('/admin-cabang/kandidat', { params }),
  batches: () => api.get('/admin-cabang/batches'),
  pendingCount: () => api.get('/admin-cabang/pending-count'),
  pendingPembayaran: () => api.get('/admin-cabang/pending-pembayaran'),
  rekapPerBatch: () => api.get('/admin-cabang/rekap-per-batch'),
  myBranches: () => api.get('/admin-cabang/my-branches'),
  pembayaranItem: (pendaftarId: number) => api.get(`/admin-cabang/pembayaran-item/${pendaftarId}`),
  savePembayaranItem: (pendaftarId: number, items: { kategori_id: number; jumlah: number }[]) =>
    api.post(`/admin-cabang/pembayaran-item/${pendaftarId}`, { items }),
  verifyPayment: (id: number) => api.post(`/admin-cabang/pendaftar/${id}/verify-payment`),
  rejectPayment: (pembayaranId: number) => api.post(`/admin-cabang/pendaftar/pembayaran/${pembayaranId}/reject-payment`),
  invoice: (id: number) => api.get(`/admin-cabang/pendaftar/${id}/invoice`),
  riwayatPembayaran: (id: number) => api.get(`/admin-cabang/pendaftar/${id}/riwayat-pembayaran`),
  bayarManual: (id: number, data: { jumlah: number; kategori_id: number }) =>
    api.post(`/admin-cabang/pendaftar/${id}/bayar-manual`, data),
  biayaKategori: () => api.get('/admin-cabang/biaya-kategori'),
  batchBiaya: (batchId: number) => api.get(`/admin-cabang/batch-biaya/${batchId}`),
  updateKandidat: (id: number, data: Record<string, unknown>) =>
    api.post(`/admin-cabang/pendaftar/${id}/update-kandidat`, data),
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
  batchDanNilai: () => api.get('/guru/batch-dan-nilai'),
  ranking: (batchId: number) => api.get(`/guru/ranking/${batchId}`),
  storeLevelEvaluation: (data: { siswa_id: number; batch_id: number; level: string; evaluasi: string }) => api.post('/guru/level-evaluation', data),
  getLevelEvaluations: (batchId: number, level: string) => api.get(`/guru/level-evaluations/${batchId}/${level}`),
}

export const lmsApi = {
  courses: () => api.get('/lms/courses'),
  courseDetail: (id: number) => api.get(`/lms/courses/${id}`),
  lessonDetail: (id: number) => api.get(`/lms/lessons/${id}`),
  completeLesson: (id: number) => api.post(`/lms/lessons/${id}/complete`),
  uncompleteLesson: (id: number) => api.delete(`/lms/lessons/${id}/complete`),
  // Student Assignments
  courseAssignments: (courseId: number) => api.get(`/lms/courses/${courseId}/assignments`),
  submitAssignment: (assignmentId: number, data: FormData) => api.post(`/lms/assignments/${assignmentId}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  nilaiLms: () => api.get('/siswa/nilai-lms'),
  evaluations: () => api.get('/siswa/evaluations'),
}

export const lmsAdminApi = {
  courses: () => api.get('/admin/lms/courses'),
  storeCourse: (data: FormData) => api.post('/admin/lms/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCourse: (id: number, data: FormData) => api.post(`/admin/lms/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourse: (id: number) => api.delete(`/admin/lms/courses/${id}`),
  lessons: (courseId: number) => api.get(`/admin/lms/courses/${courseId}/lessons`),
  courseFiles: (courseId: number) => api.get(`/admin/lms/courses/${courseId}/files`),
  storeLesson: (data: Record<string, unknown>) => api.post('/admin/lms/lessons', data),
  updateLesson: (id: number, data: Record<string, unknown>) => api.post(`/admin/lms/lessons/${id}`, data),
  deleteLesson: (id: number) => api.delete(`/admin/lms/lessons/${id}`),
  upload: (data: FormData) => api.post('/admin/lms/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  storeCourseFile: (data: FormData) => api.post('/admin/lms/files', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourseFile: (id: number) => api.delete(`/admin/lms/files/${id}`),
}

export const assignmentApi = {
  list: (courseId: number) => api.get(`/guru/assignments/${courseId}`),
  store: (data: FormData) => api.post('/guru/assignments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) => api.post(`/guru/assignments/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/guru/assignments/${id}`),
  submissions: (id: number) => api.get(`/guru/assignments/${id}/submissions`),
  grade: (id: number, data: { score: number; feedback?: string }) => api.post(`/guru/assignments/${id}/grade`, data),
}

export const kategoriPengeluaranApi = {
  list: () => api.get('/pengeluaran/kategori'),
  store: (data: { nama: string; kode: string; urutan?: number }) => api.post('/pengeluaran/kategori', data),
  update: (id: number, data: { nama: string; kode: string; urutan?: number }) => api.put(`/pengeluaran/kategori/${id}`, data),
  destroy: (id: number) => api.delete(`/pengeluaran/kategori/${id}`),
}

export const pengeluaranApi = {
  list: (params?: Record<string, string | number | undefined>) => api.get('/pengeluaran', { params }),
  store: (data: FormData) => api.post('/pengeluaran', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  show: (id: number) => api.get(`/pengeluaran/${id}`),
  update: (id: number, data: FormData) => {
    data.append('_method', 'PUT')
    return api.post(`/pengeluaran/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  destroy: (id: number) => api.delete(`/pengeluaran/${id}`),
  rekap: (tahun?: number) => api.get('/pengeluaran/rekap', { params: tahun ? { tahun } : undefined }),
  dashboard: () => api.get('/pengeluaran/dashboard'),
}

export const waNotificationApi = {
  list: (params?: Record<string, string | number | undefined>) => api.get('/wa-notifications', { params }),
  stats: () => api.get('/wa-notifications/stats'),
  sendReminder: (pendaftarId: number) => api.post(`/wa-notifications/send-reminder/${pendaftarId}`),
}

export const waSettingApi = {
  getReminderSettings: () => api.get('/wa-settings/reminder'),
  updateReminderSettings: (settings: { kategori_id: number; jatuh_tempo_hari: number; reminder_days: number[]; is_enabled: boolean; template_pesan: string | null }[]) => api.put('/wa-settings/reminder', { settings }),
  getGlobalSettings: () => api.get('/wa-settings/global'),
  updateGlobalSettings: (settings: { key: string; is_enabled: boolean; value?: string }[]) => api.put('/wa-settings/global', { settings }),

  // Batch deadlines (per batch + kategori)
  getBatchDeadlines: (batchId?: number) => api.get('/wa-settings/batch-deadlines', { params: batchId ? { batch_id: batchId } : {} }),
  saveBatchDeadlines: (deadlines: { batch_id: number; kategori_id: number; tanggal_awal: string | null; tanggal_akhir: string | null; reminder_days: number[]; is_enabled: boolean; template_pesan: string | null; channel?: string; template_email?: string | null; subject_email?: string | null }[]) =>
    api.put('/wa-settings/batch-deadlines', { deadlines }),
  deleteBatchDeadline: (id: number) => api.delete(`/wa-settings/batch-deadlines/${id}`),
  getBatchDeadlinesPublic: (batchId: number) => api.get('/wa-settings/batch-deadlines-public', { params: { batch_id: batchId } }),

  // Email notification log
  getEmailLog: (params?: Record<string, any>) => api.get('/wa-settings/email-log', { params }),
  getEmailStats: () => api.get('/wa-settings/email-stats'),
}

export const guruLmsApi = {
  courses: () => api.get('/guru/lms-courses'),
  courseDetail: (id: number) => api.get(`/guru/lms-courses/${id}`),
  storeCourse: (data: FormData) => api.post('/guru/lms-courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCourse: (id: number, data: FormData) => api.post(`/guru/lms-courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourse: (id: number) => api.delete(`/guru/lms-courses/${id}`),
  courseFiles: (courseId: number) => api.get(`/guru/lms-courses/${courseId}/files`),
  storeCourseFile: (data: FormData) => api.post('/guru/lms-courses/files', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourseFile: (id: number) => api.delete(`/guru/lms-courses/files/${id}`),
  lessons: (courseId: number) => api.get(`/guru/lms-courses/${courseId}/lessons`),
  storeLesson: (data: FormData) => api.post('/guru/lms-lessons', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateLesson: (id: number, data: FormData) => api.post(`/guru/lms-lessons/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteLesson: (id: number) => api.delete(`/guru/lms-lessons/${id}`),
}

export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:8000'

export default api
