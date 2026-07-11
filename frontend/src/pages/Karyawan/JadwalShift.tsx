import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Check, Trash2, Save, Sun,
  AlertTriangle,
} from 'lucide-react'
import { shiftJadwalApi, shiftApi } from '../../services/api'
import { karyawanApi } from '../../services/api'
import type { Shift, ShiftJadwal } from '../../types'

interface KaryawanOption {
  id: number
  name: string
  nip: string
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const shiftColors: Record<number, string> = {
  1: 'bg-emerald-500',
  2: 'bg-blue-500',
  3: 'bg-amber-500',
  4: 'bg-red-500',
  5: 'bg-indigo-500',
  6: 'bg-slate-500',
  7: 'bg-cyan-500',
}

export default function JadwalShiftPage() {
  const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [jadwalData, setJadwalData] = useState<Record<string, ShiftJadwal[]>>({})
  const [defaultShift, setDefaultShift] = useState<Shift | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedShift, setSelectedShift] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [isLibur, setIsLibur] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'save' | 'delete'>('save')
  const [confirmMessage, setConfirmMessage] = useState('')

  const fetchKaryawan = useCallback(async () => {
    try {
      const res = await karyawanApi.list({ per_page: 500, status: 'AKTIF' })
      const raw = res.data.data || res.data || []
      setKaryawanList(Array.isArray(raw) ? raw.map((k: any) => ({ id: k.id, name: k.name, nip: k.nip })) : [])
    } catch (e) {
      console.error('Gagal fetch karyawan:', e)
    }
  }, [])

  const fetchShifts = useCallback(async () => {
    try {
      const res = await shiftApi.list()
      const raw = res.data.data || res.data || []
      setShifts(Array.isArray(raw) ? raw : [])
    } catch (e) {
      console.error('Gagal fetch shifts:', e)
    }
  }, [])

  useEffect(() => { fetchKaryawan(); fetchShifts() }, [fetchKaryawan, fetchShifts])

  const loadJadwal = useCallback(async () => {
    if (!selectedUserId) return
    setLoading(true)
    try {
      const res = await shiftJadwalApi.getJadwal(selectedUserId, { bulan: month, tahun: year })
      setJadwalData(res.data.jadwals || {})
      setDefaultShift(res.data.default_shift || null)
    } catch { } finally {
      setLoading(false)
    }
  }, [selectedUserId, month, year])

  useEffect(() => { loadJadwal() }, [loadJadwal])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const getDateStr = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    )
  }

  const selectAll = () => {
    const all: string[] = []
    for (let d = 1; d <= daysInMonth; d++) all.push(getDateStr(d))
    setSelectedDates(all)
  }

  const selectWeekdays = () => {
    const weekdays: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay()
      if (day !== 0 && day !== 6) weekdays.push(getDateStr(d))
    }
    setSelectedDates(weekdays)
  }

  const clearDates = () => setSelectedDates([])

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }
    setMonth(newMonth)
    setYear(newYear)
    setSelectedDates([])
  }

  const handleSave = async () => {
    if (!selectedUserId || !selectedShift) return
    setLoading(true)
    try {
      await shiftJadwalApi.storeMultiple({
        user_id: selectedUserId,
        tanggal_list: selectedDates,
        keterangan,
        ...(isLibur ? { is_libur: 1 } : { shift_id: parseInt(selectedShift) }),
      })
      setSelectedDates([])
      setSelectedShift('')
      setKeterangan('')
      setIsLibur(false)
      loadJadwal()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUserId) return
    setLoading(true)
    try {
      const ids: number[] = []
      selectedDates.forEach((tgl) => {
        (jadwalData[tgl] || []).forEach((j) => {
          if (j.id) ids.push(j.id)
        })
      })
      await Promise.all(ids.map((id) => shiftJadwalApi.delete(id)))
      setSelectedDates([])
      loadJadwal()
    } catch { } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const confirmSave = () => {
    if (!selectedUserId) return
    if (!selectedShift) return
    if (selectedDates.length === 0) return
    setConfirmMessage(`Simpan ${selectedDates.length} hari jadwal shift?`)
    setConfirmAction('save')
    setShowConfirm(true)
  }

  const confirmDelete = () => {
    const hasData = selectedDates.some((tgl) => (jadwalData[tgl] || []).length > 0)
    if (!hasData) return
    setConfirmMessage(`Hapus jadwal dari ${selectedDates.length} hari?`)
    setConfirmAction('delete')
    setShowConfirm(true)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
  }

  const isWeekend = (day: number) => {
    const d = new Date(year, month - 1, day).getDay()
    return d === 0 || d === 6
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Atur Jadwal Shift</h1>
            <p className="text-sm text-slate-500">Kelola jadwal shift karyawan per tanggal</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Pilih Karyawan */}
          <div className="rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Karyawan</label>
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value ? parseInt(e.target.value) : ''); setSelectedDates([]) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Pilih Karyawan --</option>
              {karyawanList.map((k) => (
                <option key={k.id} value={k.id}>{k.name} ({k.nip})</option>
              ))}
            </select>
          </div>

          {/* Bulan & Tahun */}
          <div className="rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bulan & Tahun</label>
            <div className="grid grid-cols-2 gap-2">
              <select value={month} onChange={(e) => { setMonth(parseInt(e.target.value)); setSelectedDates([]) }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                {MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => { setYear(parseInt(e.target.value)); setSelectedDates([]) }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Dates Info */}
          {selectedDates.length > 0 && (
            <div className="rounded-lg p-4 shadow-sm">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                TANGGAL DIPILIH: {selectedDates.length} hari
              </label>
              <div className="flex flex-wrap gap-1 mb-3 max-h-28 overflow-y-auto">
                {selectedDates.length <= 50 ? (
                  [...selectedDates].sort().map((tgl) => {
                    const d = new Date(tgl + 'T00:00:00')
                    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    return <span key={tgl} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{label}</span>
                  })
                ) : (
                  <span className="text-sm text-blue-700 font-medium">{selectedDates.length} tanggal terpilih</span>
                )}
              </div>
            </div>
          )}

          {/* Shift Selection */}
          <div className="rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">PILIH SHIFT:</label>
            <select value={selectedShift} onChange={(e) => { setIsLibur(e.target.value === 'LIBUR'); setSelectedShift(e.target.value) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2">
              <option value="">-- Pilih Shift --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk.substring(0, 5)} - {s.jam_pulang.substring(0, 5)})</option>
              ))}
              <option value="LIBUR">🔴 Libur</option>
            </select>

            {isLibur && (
              <div className="mb-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg font-medium flex items-center gap-2">
                <Sun size={14} /> Libur
              </div>
            )}

            <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan (opsional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-3"
            />

            <div className="flex gap-2">
              <button onClick={confirmDelete} disabled={selectedDates.length === 0 || loading}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                <Trash2 size={14} /> Hapus
              </button>
              <button onClick={confirmSave} disabled={selectedDates.length === 0 || !selectedShift || loading}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-[#0D1F3C] text-white hover:bg-[#1a2d4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>

          {/* Legend */}
          {shifts.length > 0 && (
            <div className="rounded-lg p-4 shadow-sm">
              <span className="text-xs font-semibold text-gray-700">Legenda Shift:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {shifts.map((s) => (
                  <span key={s.id} className={`inline-flex items-center px-2 py-0.5 text-xs text-white rounded-full ${shiftColors[s.id] || 'bg-slate-500'}`}>
                    {s.nama_shift}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Calendar */}
        <div className="lg:col-span-3">
          <div className="rounded-lg p-4 shadow-sm">
            {selectedUserId ? (
              <>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-bold text-slate-800">{MONTHS[month - 1]} {year}</h3>
                  <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button onClick={selectAll} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">Pilih Semua</button>
                  <button onClick={selectWeekdays} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors">Pilih Hari Kerja</button>
                  <button onClick={clearDates} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">Clear</button>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {dayNames.map((name, i) => (
                          <th key={i} className={`p-2 text-xs font-semibold text-center border border-slate-200 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                            {name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }).map((_, weekIdx) => (
                        <tr key={weekIdx}>
                          {Array.from({ length: 7 }).map((_, dayIdx) => {
                            const dayNum = weekIdx * 7 + dayIdx - firstDay + 1
                            if (dayNum < 1 || dayNum > daysInMonth) return <td key={dayIdx} className="border border-slate-100 p-1" />

                            const dateStr = getDateStr(dayNum)
                            const isSelected = selectedDates.includes(dateStr)
                            const jadwalArr = jadwalData[dateStr] || []
                            const hasData = jadwalArr.length > 0
                            const isLiburDay = isWeekend(dayNum) || jadwalArr.some((j) => j.is_libur)

                            // Fallback ke default shift jika tidak ada jadwal manual
                            const effectiveShifts = hasData ? jadwalArr : (defaultShift && !isWeekend(dayNum) ? [{ shift: defaultShift } as ShiftJadwal] : [])

                            return (
                              <td key={dayIdx} className="border border-slate-100 p-1">
                                <div
                                  onClick={() => toggleDate(dateStr)}
                                  className={`relative flex flex-col items-center justify-center min-h-[56px] rounded-lg cursor-pointer transition-all duration-150
                                    ${isSelected ? 'bg-[#0D1F3C] text-white shadow-md scale-105' : 'hover:bg-slate-50 hover:shadow-sm'}
                                    ${isToday(dayNum) && !isSelected ? 'ring-2 ring-blue-400' : ''}
                                  `}
                                >
                                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : isLiburDay && !hasData ? 'text-red-400' : 'text-slate-700'}`}>
                                    {dayNum}
                                  </span>
                                  {effectiveShifts.map((j: any, idx: number) => (
                                    j.is_libur ? (
                                      <span key={idx} className="text-[9px] font-bold text-red-500 mt-0.5">LIBUR</span>
                                    ) : j.shift ? (
                                      <span key={idx} className={`text-[9px] text-white px-1 rounded mt-0.5 ${shiftColors[j.shift.id] || 'bg-slate-500'}`}
                                        style={{ lineHeight: '1.2' }}>
                                        {j.shift.nama_shift}
                                      </span>
                                    ) : null
                                  ))}
                                  {isSelected && <Check size={12} className="mt-0.5" />}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Existing Schedule */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-semibold text-slate-600">Jadwal Tersimpan:</span>
                  {defaultShift && (
                    <span className="ml-2 text-[10px] text-slate-400">(default: <strong>{defaultShift.nama_shift}</strong>)</span>
                  )}
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {(() => {
                      const allDays: { tgl: string; arr: any[] }[] = []
                      for (let d = 1; d <= daysInMonth; d++) {
                        const tgl = getDateStr(d)
                        const manual = jadwalData[tgl] || []
                        if (manual.length > 0) {
                          allDays.push({ tgl, arr: manual })
                        } else if (defaultShift && !isWeekend(d)) {
                          allDays.push({ tgl, arr: [{ shift: defaultShift, is_default: true }] })
                        }
                      }
                      return allDays.length > 0 ? (
                        allDays.sort((a, b) => a.tgl.localeCompare(b.tgl)).map(({ tgl, arr }) => {
                          const d = new Date(tgl + 'T00:00:00')
                          const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
                          return (
                            <div key={tgl} className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 w-24 shrink-0">{label}</span>
                              <div className="flex gap-1">
                                {arr.map((j: any, idx: number) => (
                                  j.is_libur ? (
                                    <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 font-medium rounded text-[10px]">LIBUR</span>
                                  ) : j.shift ? (
                                    <span key={idx} className={`px-2 py-0.5 rounded text-[10px] ${j.is_default ? 'bg-slate-200 text-slate-600' : 'text-white ' + (shiftColors[j.shift.id] || 'bg-slate-500')}`}>
                                      {j.shift.nama_shift}{j.is_default ? '' : ''}
                                    </span>
                                  ) : null
                                ))}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <span className="text-xs text-slate-400">Pilih karyawan untuk melihat jadwal</span>
                      )
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Calendar size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Pilih karyawan untuk melihat kalender jadwal shift</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Konfirmasi</h3>
            <p className="text-sm text-gray-500 mb-5">{confirmMessage}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={confirmAction === 'save' ? handleSave : handleDelete}
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-[#0D1F3C] text-white hover:bg-[#1a2d4a] disabled:opacity-50 transition-colors">
                {loading ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
