export interface Karyawan {
  id: number
  nik: string
  nip: string
  name: string
  email: string
  jabatan: string
  password?: string
  role: string
  divisi_id: number | null
  cabang_ids: number[]
  shift_ids: number[]
  shift_id: number | null
  status: string
  pendidikan_terakhir: string
  no_hp: string
  alamat: string
  foto_profil: string | null
  foto_ktp: string | null
  foto_ijazah: string | null
  foto_kk: string | null
  cv_file: string | null
  sertifikat_file: string | null
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  agama: string
  status_pernikahan: string
  can_access_khusus: boolean
  status_kerja: string
  tanggal_masuk: string
  last_login: string | null
  divisi?: Divisi
  shift?: Shift
  cabang?: Cabang[]
  shifts?: Shift[]
}

export interface Divisi {
  id: number
  kode_divisi: string
  nama_divisi: string
}

export interface Cabang {
  id: number
  kode_cabang: string
  barcode: string | null
  nama_cabang: string
  status_pusat: string
  latitude: number
  longitude: number
  radius: number
  alamat: string | null
  created_at?: string
  updated_at?: string
}

export interface Shift {
  id: number
  kode_shift: string | null
  nama_shift: string
  jam_masuk: string
  jam_pulang: string
  total_jam?: number | null
  toleransi: number
  status: string
  keterangan: string | null
  created_at?: string
  updated_at?: string
}

export interface Pagination {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface KaryawanForm {
  nik: string
  name: string
  jabatan: string
  cabang_ids: number[]
  divisi_id: number | string
  shift_ids: number[]
  no_hp: string
  email: string
  pendidikan_terakhir: string
  status_kerja: string
  tanggal_masuk: string
  jenis_kelamin: string
  agama: string
  tempat_lahir: string
  tanggal_lahir: string
  status_pernikahan: string
  alamat: string
  can_access_khusus: boolean
  nip?: string
  foto_profil?: File | null
  foto_ktp?: File | null
  foto_ijazah?: File | null
  foto_kk?: File | null
  cv_file?: File | null
  sertifikat_file?: File | null
}

export interface FormModalState {
  show: boolean
  editing: Karyawan | null
  submitting: boolean
}

export interface ShiftJadwal {
  id: number
  user_id: number
  shift_id: number | null
  tanggal: string
  keterangan: string | null
  is_libur: boolean
  shift?: Shift | null
  user?: {
    id: number
    name: string
    nip: string
  } | null
}

export interface RekapAbsensiItem {
  nama: string
  jabatan: string
  divisi: string
  cabang: string
  hadir: number
  terlambat: number
  izin: number
  alpa: number
  pulang_awal: number
  libur: number
  jumlah_lembur: number
  total_jam_lembur: string
  sensei_kehadiran: number
  total_agenda: number
  khusus: number
  jam_khusus: string
  total_hadir: number
  total_kehadiran: number
  total_jam_kerja: string
  grand_total_jam: string
}

export interface HariLibur {
  id: number
  tanggal: string
  keterangan: string
  created_at: string | null
}

export interface Lembur {
  id: number
  user_id: number
  jam_masuk: string | null
  jam_keluar: string | null
  keterangan: string
  foto: string
  status: string
  created_at: string | null
  user?: {
    id: number
    name: string
    nip: string
    divisi?: Divisi
  } | null
}

export interface Izin {
  id: number
  user_id: number
  jenis_izin: string
  tgl_mulai: string
  tgl_selesai: string
  alasan: string | null
  lampiran: string | null
  status: string
  approved_by: number | null
  approved_at: string | null
  created_at: string | null
  user?: {
    id: number
    name: string
    nip: string
    divisi?: Divisi
  } | null
  approver?: {
    id: number
    name: string
  } | null
}

export interface Guru {
  id: number
  user_id: number
  nama: string
  nip: string | null
  mata_pelajaran: string | null
  no_hp: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  user?: {
    id: number
    name: string
    foto_profil: string | null
    email: string
    role: string
  } | null
}

export interface Agenda {
  id: number
  user_id: number
  judul: string
  keterangan: string | null
  foto: string | null
  tanggal: string
  jam_mulai: string | null
  jam_selesai: string | null
  jam_absen_masuk: string | null
  jam_absen_keluar: string | null
  status: string
  status_absen: string
  created_at: string | null
  updated_at: string | null
  user?: {
    id: number
    name: string
    nip: string
    jabatan: string
    divisi?: Divisi
    cabang?: Cabang[]
  } | null
}

export interface AbsensiKhusus {
  id: number
  user_id: number
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  total_detik: number | null
  status: string
  foto_masuk: string | null
  foto_keluar: string | null
  latitude_masuk: number | null
  longitude_masuk: number | null
  latitude_keluar: number | null
  longitude_keluar: number | null
  user?: {
    id: number
    name: string
    nip: string
    divisi?: Divisi
  } | null
}

export interface Absensi {
  id: number
  user_id: number
  shift_id: number | null
  cabang_id: number | null
  izin_id: number | null
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  lat_masuk: number | null
  long_masuk: number | null
  lat_pulang: number | null
  long_pulang: number | null
  status: string
  foto_masuk: string | null
  foto_pulang: string | null
  keterangan: string | null
  user?: Karyawan | null
  shift?: Shift | null
  cabang?: Cabang | null
}

export interface RekapKehadiranSenseiDayEntry {
  initial: string
  kelas_nama: string
  kelas_id: number
  status: string
  color: string
  text_color: string
  absensi_id: number
}

export interface RekapKehadiranSenseiDay {
  day: number
  day_of_week: number
  in_class_range: boolean
  entries: RekapKehadiranSenseiDayEntry[]
}

export interface KehadiranSenseiItem {
  id: number
  kelas_sensei_id: number
  user_id: number
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  catatan: string | null
  pertemuan_ke?: number
  foto_masuk?: string | null
  foto_pulang?: string | null
  user?: {
    id: number
    name: string
    nip: string
  } | null
  kelas_sensei?: {
    id: number
    nama_kelas: string
    level: string
  } | null
}

export interface KehadiranSenseiGroup {
  kelas: {
    id: number
    nama_kelas: string
    level: string
    user_id: number
    tanggal_mulai: string
    tanggal_selesai: string
    status: string
    batch_relasi?: { id: number; nama_batch: string } | null
    user?: { id: number; name: string } | null
  }
  absensis: KehadiranSenseiItem[]
  total: number
  stats: {
    total_absen: number
    hadir: number
    terlambat: number
    pulang_cepat: number
    tidak_pulang: number
    alpa: number
    libur: number
  }
}

export interface KelasSenseiInfo {
  id: number
  nama_kelas: string
  level: string
  tanggal_mulai: string
  tanggal_selesai: string
  total_pertemuan: number
  jumlah_absen: number
  sensei: string
}

export interface RekapJadwalShiftDayShift {
  initial: string
  shift_nama: string
  shift_id: number | null
  status: string
  color: string
  text_color: string
  absensi_id: number | null
}

export interface RekapJadwalShiftDay {
  day: number
  day_of_week: number
  shifts: RekapJadwalShiftDayShift[]
  is_libur: boolean
}

export interface BatchData {
  id: number
  nama_batch: string
  status: string
}

export interface Siswa {
  id: number
  user_id: number | null
  shift_id: number | null
  kelas_id: number | null
  batch_id: number | null
  nama: string
  kelas: string | null
  batch: string | null
  level: number | null
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  alamat: string | null
  no_hp: string | null
  foto: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  shift?: {
    id: number
    nama_shift: string
    jam_masuk: string
    jam_pulang: string
  } | null
  kelas_relasi?: {
    id: number
    nama_kelas: string
    status: string
  } | null
  batch_relasi?: {
    id: number
    nama_batch: string
    status: string
  } | null
  user?: {
    id: number
    name: string
    email: string
    role: string
  } | null
}

export interface JadwalLevelItem {
  id: number
  batch_id: number
  level: number
  tanggal_mulai: string
  tanggal_selesai: string
  batch_nama: string
}

export interface KelasSenseiData {
  id: number
  user_id: number
  batch_id: number | null
  nama_kelas: string
  level: string
  tanggal_mulai: string
  tanggal_selesai: string
  catatan: string | null
  status: string
  total_pertemuan: number
  jumlah_absen: number
  jumlah_alpa: number
  jumlah_izin: number
  user?: {
    id: number
    name: string
    nip: string | null
  } | null
  batch_relasi?: {
    id: number
    nama_batch: string
    status: string
  } | null
}

export interface AbsensiSiswaItem {
  id: number
  siswa_id: number
  kelas_sensei_id: number | null
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  keterangan: string | null
  foto_masuk: string | null
  foto_pulang: string | null
  siswa?: {
    id: number
    nama: string
    foto: string | null
    kelas: string | null
    batch: string | null
    level: number | null
    kelas_relasi?: {
      id: number
      nama_kelas: string
    } | null
    batch_relasi?: {
      id: number
      nama_batch: string
    } | null
  } | null
  kelas_sensei?: {
    id: number
    nama_kelas: string
    level: string
  } | null
}

export interface PenilaianItem {
  id: number
  user_id: number
  nama_siswa: string
  kelas: string | null
  mata_pelajaran: string | null
  nilai: number | null
  keterangan: string | null
  tanggal_penilaian: string
  created_at: string | null
  user?: {
    id: number
    name: string
  } | null
}

export interface RekapSiswaItem {
  id: number
  nama: string
  kelas: string
  batch: string
  hadir: number
  terlambat: number
  izin: number
  sakit: number
  alpa: number
  total_hadir: number
  total: number
  persentase: number
}

export interface DetailResponse {
  status: string
  data: Karyawan
  cabang: Cabang[]
  shifts: Shift[]
}

export interface CompanyProfile {
  id: number
  company_name: string
  pt_name: string
  address: string
  email: string
  phone: string
  logo: string | null
  logo_url: string | null
}
