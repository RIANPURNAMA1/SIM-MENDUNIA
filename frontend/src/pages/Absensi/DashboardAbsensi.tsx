import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import {
  Users, CalendarCheck, MapPin, Clock, Timer,
  Calendar, ArrowRight, FileText, UserCheck,
  TrendingUp, Search, RotateCcw,
} from 'lucide-react'
import type { Cabang, Divisi } from '../../types'
import { absensiKaryawanApi, karyawanApi, izinApi, authApi, kehadiranApi } from '../../services/api'

Chart.register(...registerables)

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Pagi'
  if (h < 15) return 'Siang'
  if (h < 18) return 'Sore'
  return 'Malam'
}

function formatDateLong() {
  const d = new Date()
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateParam(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function formatLabel(tanggal: string) {
  const d = new Date(tanggal)
  return dayNames[d.getDay()].slice(0, 3)
}

interface StatsHariIni {
  total: number
  hadir: number
  terlambat: number
}

interface RiwayatItem {
  id: number
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  user?: { id: number; name: string; nip?: string }
  shift?: { nama_shift?: string; nama?: string; jam_mulai: string; jam_selesai: string }
}

interface IzinItem {
  id: number
  jenis_izin: string
  tgl_mulai: string
  status: string
  user?: { id: number; name: string }
}

interface KaryawanItem {
  id: number
  nama: string
  jenis_kelamin: string
  status: string
}

export default function DashboardAbsensi() {
  const donutRef = useRef<HTMLCanvasElement | null>(null)
  const donutChartRef = useRef<Chart | null>(null)
  const waveRef = useRef<HTMLCanvasElement | null>(null)
  const waveChartRef = useRef<Chart | null>(null)
  const [time, setTime] = useState(formatTime())
  const [loading, setLoading] = useState(true)

  const [userName, setUserName] = useState('Karyawan')
  const [stats, setStats] = useState<StatsHariIni | null>(null)
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [karyawan, setKaryawan] = useState<KaryawanItem[]>([])
  const [izinPending, setIzinPending] = useState<IzinItem[]>([])
  const [grafik, setGrafik] = useState<any[]>([])

  const [filterCabang, setFilterCabang] = useState('')
  const [filterDivisi, setFilterDivisi] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [listCabang, setListCabang] = useState<Cabang[]>([])
  const [listDivisi, setListDivisi] = useState<Divisi[]>([])

  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchKehadiran = useCallback(async () => {
    const params: Record<string, string> = {
      start_date: formatDateParam(new Date()),
      end_date: formatDateParam(new Date()),
    }
    if (filterCabang) params.cabang_id = filterCabang
    if (filterDivisi) params.divisi_id = filterDivisi
    if (filterStatus) params.status = filterStatus

    try {
      const kehRes = await kehadiranApi.list(params)
      const keh = kehRes.data.data || []
      setRiwayat(Array.isArray(keh) ? keh.map((a: any) => ({
        id: a.id,
        tanggal: a.tanggal,
        jam_masuk: a.jam_masuk,
        jam_keluar: a.jam_keluar,
        status: a.status ? (a.status.charAt(0) + a.status.slice(1).toLowerCase()) : '-',
        user: a.user,
        shift: a.shift ? { nama: a.shift.nama_shift || a.shift.nama, jam_mulai: a.shift.jam_mulai, jam_selesai: a.shift.jam_selesai } : null,
      })) : [])
      setListCabang(kehRes.data.list_cabang || [])
      setListDivisi(kehRes.data.list_divisi || [])
    } catch (err) {
      console.error(err)
    }
  }, [filterCabang, filterDivisi, filterStatus])

  useEffect(() => {
    fetchKehadiran()
  }, [fetchKehadiran])

  useEffect(() => {
    Promise.all([
      authApi.user(),
      absensiKaryawanApi.statsHariIni(),
      karyawanApi.list({}),
      izinApi.list({ status: 'PENDING', per_page: 3 }),
      absensiKaryawanApi.grafikMingguan(),
    ]).then(([authRes, statsRes, karRes, izinRes, grafRes]) => {
      if (authRes?.data?.name) setUserName(authRes.data.name)
      const s = statsRes.data.data
      if (s) setStats(s)

      const k = karRes.data.data || karRes.data || []
      setKaryawan(Array.isArray(k) ? k : [])

      const iz = izinRes.data.data || []
      setIzinPending(Array.isArray(iz) ? iz : [])

      const g = grafRes.data.data || []
      setGrafik(Array.isArray(g) ? g : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!donutRef.current) return
    if (donutChartRef.current) donutChartRef.current.destroy()

    const hadir = stats?.hadir ?? 0
    const terlambat = stats?.terlambat ?? 0
    const belumAbsen = Math.max(0, (stats?.total ?? 0) - hadir - terlambat)
    const izinSakit = 0

    donutChartRef.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Terlambat', 'Belum Absen', 'Cuti / Izin / Sakit'],
        datasets: [{
          data: [hadir, terlambat, belumAbsen, izinSakit],
          backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        plugins: { legend: { display: false } },
      },
    })

    return () => {
      if (donutChartRef.current) donutChartRef.current.destroy()
    }
  }, [stats])

  useEffect(() => {
    if (!waveRef.current || grafik.length === 0) return
    if (waveChartRef.current) waveChartRef.current.destroy()

    const labels = grafik.map((d: any) => formatLabel(d.tanggal))
    const ctx = waveRef.current.getContext('2d')

    waveChartRef.current = new Chart(waveRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Hadir',
            data: grafik.map((d: any) => d.hadir),
            borderColor: '#3b82f6',
            backgroundColor: ctx ? (() => {
              const g = ctx.createLinearGradient(0, 0, 0, 200)
              g.addColorStop(0, 'rgba(59, 130, 246, 0.25)')
              g.addColorStop(1, 'rgba(59, 130, 246, 0.02)')
              return g
            })() : 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#3b82f6',
            borderWidth: 2,
          },
          {
            label: 'Terlambat',
            data: grafik.map((d: any) => d.terlambat),
            borderColor: '#f59e0b',
            backgroundColor: ctx ? (() => {
              const g = ctx.createLinearGradient(0, 0, 0, 200)
              g.addColorStop(0, 'rgba(245, 158, 11, 0.2)')
              g.addColorStop(1, 'rgba(245, 158, 11, 0.02)')
              return g
            })() : 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#f59e0b',
            borderWidth: 2,
          },
          {
            label: 'Izin / Sakit',
            data: grafik.map((d: any) => d.izin),
            borderColor: '#10b981',
            backgroundColor: ctx ? (() => {
              const g = ctx.createLinearGradient(0, 0, 0, 200)
              g.addColorStop(0, 'rgba(16, 185, 129, 0.2)')
              g.addColorStop(1, 'rgba(16, 185, 129, 0.02)')
              return g
            })() : 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#10b981',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: '#0D1F3C',
            titleFont: { size: 11 },
            bodyFont: { size: 10 },
            padding: 8,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#94a3b8' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#94a3b8', stepSize: 1 },
          },
        },
      },
    })

    return () => {
      if (waveChartRef.current) waveChartRef.current.destroy()
    }
  }, [grafik])

  const totalKaryawan = karyawan.length
  const lakiCount = karyawan.filter(k => k.jenis_kelamin?.toLowerCase() === 'laki-laki').length
  const perempuanCount = karyawan.filter(k => k.jenis_kelamin?.toLowerCase() === 'perempuan').length
  const pctLaki = totalKaryawan ? Math.round((lakiCount / totalKaryawan) * 100) : 0
  const pctPerempuan = totalKaryawan ? Math.round((perempuanCount / totalKaryawan) * 100) : 0

  const hadirCount = stats?.hadir ?? 0
  const terlambatCount = stats?.terlambat ?? 0
  const totalAbsen = stats?.total ?? 0
  const belumAbsen = Math.max(0, totalAbsen - hadirCount - terlambatCount)
  const izinSakitCount = 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Selamat {getGreeting()}, {userName}</h1>
            <p className="text-sm text-slate-500">{formatDateLong()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <Timer size={16} className="text-blue-600" />
            {time} WIB
          </span>
        </div>
      </div>

      {/* Wave Chart */}
      {grafik.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <TrendingUp size={16} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Grafik Absensi (7 Hari)</h3>
              </div>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <canvas ref={waveRef} />
          </div>
        </div>
      )}

      {/* Row 1: 2 Cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Karyawan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck size={28} className="text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Laki - Laki</p>
                <p className="font-bold text-slate-800">{pctLaki}% <span className="text-[10px] font-normal text-slate-400">({lakiCount} Orang)</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck size={28} className="text-orange-400" />
              <div>
                <p className="text-xs text-slate-500">Perempuan</p>
                <p className="font-bold text-slate-800">{pctPerempuan}% <span className="text-[10px] font-normal text-slate-400">({perempuanCount} Orang)</span></p>
              </div>
            </div>
            <div className="col-span-2 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">Total Karyawan</span>
              <span className="text-lg font-bold text-[#0D1F3C]">{totalKaryawan} Orang</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Pengaturan</h3>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <Link to="/cabang" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <MapPin size={14} /> Lokasi Absensi
            </Link>
            <Link to="/izin-cuti" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <FileText size={14} /> Approval Izin
            </Link>
            <Link to="/shift" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <Clock size={14} /> Jam Kerja
            </Link>
            <Link to="/approval-lembur" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <Calendar size={14} /> Approval Lembur
            </Link>
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-8" alt="Google Play" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-8" alt="App Store" />
          </div>
        </div>
      </div>

      {/* Row 2: Rekap + Pengajuan */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Rekap Absensi Hari Ini</h3>
            <span className="text-xs font-medium text-slate-400">{formatDateLong()}</span>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="relative h-48 w-48 flex-shrink-0">
              <canvas ref={donutRef} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">Belum Absen</span>
                <span className="text-2xl font-bold text-slate-800">{belumAbsen}</span>
              </div>
            </div>

            <div className="w-full flex-1 text-sm">
              <div className="grid grid-cols-1 gap-1">
                {[
                  { label: 'Hadir', value: hadirCount, color: 'text-blue-600' },
                  { label: 'Terlambat', value: terlambatCount, color: 'text-orange-500' },
                  { label: 'Belum Absen', value: belumAbsen, color: 'text-red-600', highlight: true },
                  { label: 'Cuti / Izin / Sakit', value: izinSakitCount, color: 'text-teal-600' },
                ].map((item) => (
                  <div key={item.label}
                    className={`flex justify-between p-2 ${item.highlight ? 'bg-red-50/50' : 'border-b border-slate-50'}`}>
                    <span className={item.highlight ? 'font-medium text-slate-700' : 'text-slate-500'}>{item.label}</span>
                    <span className={`font-bold ${item.color}`}>
                      {item.value} <small className="font-normal italic text-slate-400">Karyawan</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-600">
                  <Calendar size={14} /> Kalender Absensi
                </button>
                <Link to="/data-kehadiran"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500 px-4 py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50">
                  Lihat Semua
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Daftar Pengajuan</h3>
          <div className="custom-scrollbar max-h-[300px] space-y-4 overflow-y-auto pr-2">
            {izinPending.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4">Tidak ada pengajuan pending</p>
            ) : (
              izinPending.map((item) => (
                <div key={item.id} className={`rounded-lg bg-slate-50 p-3 border-l-4 ${item.jenis_izin === 'SAKIT' ? 'border-red-500' : 'border-teal-500'}`}>
                  <div className="mb-1 flex items-start justify-between">
                    <p className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <Clock size={12} /> {item.tgl_mulai ? new Date(item.tgl_mulai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${item.jenis_izin === 'SAKIT' ? 'bg-red-500' : 'bg-teal-500'}`}>
                      {item.jenis_izin}
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase text-slate-700">{item.user?.name || '-'}</p>
                  <p className="text-[10px] text-slate-400">Belum Disetujui oleh Admin</p>
                </div>
              ))
            )}
          </div>
          <Link to="/izin-cuti"
            className="mt-6 flex w-full items-center justify-center gap-1 rounded-lg border border-blue-600 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50">
            LIHAT SEMUA <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <CalendarCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Riwayat Absensi Hari Ini</h3>
              <p className="text-[11px] text-slate-400">Seluruh karyawan</p>
            </div>
          </div>
          <Link to="/data-kehadiran" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            Lihat Semua <ArrowRight size={12} />
          </Link>
        </div>
        {/* Filter */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Semua Cabang</option>
              {listCabang.map((c) => (
                <option key={c.id} value={c.id}>{c.nama_cabang}</option>
              ))}
            </select>
            <select value={filterDivisi} onChange={(e) => setFilterDivisi(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Semua Divisi</option>
              {listDivisi.map((d) => (
                <option key={d.id} value={d.id}>{d.nama_divisi}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin</option>
              <option value="ALPA">Alpa</option>
            </select>
            <button onClick={() => fetchKehadiran()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
              <Search size={16} />
              Filter
            </button>
            <button onClick={() => { setFilterCabang(''); setFilterDivisi(''); setFilterStatus('') }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 text-left font-semibold">Karyawan</th>
                <th className="px-5 py-3 text-left font-semibold">Shift</th>
                <th className="px-5 py-3 text-left font-semibold">Jam Masuk</th>
                <th className="px-5 py-3 text-left font-semibold">Jam Pulang</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-slate-400">Belum ada absensi hari ini</td>
                </tr>
              ) : (
                riwayat.map((row, i) => {
                  const jamMasuk = row.jam_masuk ?? '-'
                  const jamKeluar = row.jam_keluar ?? '-'
                  const shiftLabel = row.shift
                    ? `${row.shift.nama} (${row.shift.jam_mulai} - ${row.shift.jam_selesai})`
                    : '-'
                  const statusKey = row.status?.toLowerCase() === 'hadir' ? 'Hadir'
                    : row.status?.toLowerCase() === 'terlambat' ? 'Terlambat'
                    : 'Lainnya'
                  const statusClass = statusKey === 'Hadir' ? 'bg-green-50 text-green-700'
                    : statusKey === 'Terlambat' ? 'bg-orange-50 text-orange-600'
                    : 'bg-blue-50 text-blue-600'
                  const dotClass = statusKey === 'Hadir' ? 'bg-green-500'
                    : statusKey === 'Terlambat' ? 'bg-orange-500' : 'bg-blue-500'
                  return (
                    <tr key={row.id || i} className="border-b border-slate-50 transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{row.user?.name || '-'}</span>
                          {row.user?.nip && <span className="text-[11px] text-slate-400">{row.user.nip}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{shiftLabel}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={`font-medium ${jamMasuk === '-' ? 'text-slate-400' : 'text-slate-800'}`}>{jamMasuk}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={`font-medium ${jamKeluar === '-' ? 'text-slate-400' : 'text-slate-800'}`}>{jamKeluar}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>
                          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
