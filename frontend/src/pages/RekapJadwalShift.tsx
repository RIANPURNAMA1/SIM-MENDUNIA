import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Search, RotateCcw, X } from "lucide-react";
import { rekapJadwalShiftApi, karyawanApi, shiftApi } from "../services/api";
import type { RekapJadwalShiftDay, Karyawan, Shift } from "../types";

const MONTHS_IND = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STATUS_OPTIONS = [
  { value: "HADIR", label: "Hadir", color: "text-emerald-600" },
  { value: "TERLAMBAT", label: "Terlambat", color: "text-amber-600" },
  { value: "IZIN", label: "Izin", color: "text-blue-600" },
  { value: "ALPA", label: "Alpa", color: "text-rose-600" },
  { value: "PULANG LEBIH AWAL", label: "Pulang Lebih Awal", color: "text-orange-600" },
  { value: "TIDAK ABSEN PULANG", label: "Tidak Absen Pulang", color: "text-rose-600" },
  { value: "LIBUR", label: "Libur", color: "text-slate-500" },
];

export default function RekapJadwalShiftPage() {
  const now = new Date();
  const [rekapData, setRekapData] = useState<Record<string, RekapJadwalShiftDay>>({});
  const [listKaryawan, setListKaryawan] = useState<Karyawan[]>([]);
  const [listShift, setListShift] = useState<Shift[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [karyawanLoading, setKaryawanLoading] = useState(true);

  const [modal, setModal] = useState<{
    show: boolean;
    tanggal: string;
    shift: { shift_id: number | null; shift_nama: string; status: string };
    submitting: boolean;
  }>({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false });

  useEffect(() => {
    Promise.all([
      karyawanApi.list({ per_page: 500, status: "AKTIF" }),
      shiftApi.list(),
    ])
      .then(([karyawanRes, shiftRes]) => {
        setListKaryawan(karyawanRes.data.data || karyawanRes.data || []);
        setListShift(shiftRes.data.data || shiftRes.data || []);
      })
      .catch(console.error)
      .finally(() => setKaryawanLoading(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await rekapJadwalShiftApi.getRekap(selectedUserId, { bulan, tahun });
      setRekapData(res.data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, bulan, tahun]);

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const firstDayOfWeek = new Date(tahun, bulan - 1, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const dateStr = (day: number) =>
    `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleCellClick = (tanggal: string, dayData: RekapJadwalShiftDay) => {
    if (!dayData.shifts.length) return;
    const s = dayData.shifts[0];
    setModal({
      show: true,
      tanggal,
      shift: {
        shift_id: s.shift_id,
        shift_nama: s.shift_nama,
        status: s.status === "BELUM ABSEN" ? "HADIR" : s.status,
      },
      submitting: false,
    });
  };

  const handleUpdateStatus = async () => {
    if (!selectedUserId) return;
    setModal((prev) => ({ ...prev, submitting: true }));
    try {
      await rekapJadwalShiftApi.updateStatus({
        user_id: selectedUserId,
        tanggal: modal.tanggal,
        shift_id: modal.shift.shift_id,
        status: modal.shift.status,
      });
      setModal({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false });
      fetchData();
    } catch (err) {
      console.error(err);
      setModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getSummary = () => {
    const s = { hadir: 0, terlambat: 0, izin: 0, alpa: 0, libur: 0, belumAbsen: 0 };
    Object.values(rekapData).forEach((day) => {
      day.shifts.forEach((sh) => {
        if (sh.status === "HADIR") s.hadir++;
        else if (sh.status === "TERLAMBAT") s.terlambat++;
        else if (sh.status === "IZIN") s.izin++;
        else if (sh.status === "ALPA" || sh.status === "TIDAK ABSEN PULANG") s.alpa++;
        else if (sh.status === "LIBUR") s.libur++;
        else s.belumAbsen++;
      });
    });
    return s;
  };

  const s = getSummary();

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <CalendarCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Rekap Jadwal Shift</h1>
            <p className="text-sm text-slate-500">Kalender kehadiran per karyawan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
            className="min-w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Pilih Karyawan</option>
            {listKaryawan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} - {k.jabatan || "-"}
              </option>
            ))}
          </select>
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {MONTHS_IND.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={!selectedUserId || loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
          >
            <Search size={16} />
            Tampilkan
          </button>
          <button
            onClick={() => {
              setSelectedUserId("");
              setBulan(now.getMonth() + 1);
              setTahun(now.getFullYear());
              setRekapData({});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-emerald-600">{s.hadir}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hadir</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-amber-600">{s.terlambat}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Telat</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-blue-600">{s.izin}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Izin</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-rose-600">{s.alpa}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Alpa</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-500">{s.libur}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Libur</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">{s.belumAbsen}</span>
            <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">Blm Absen</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> Hadir</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-amber-400" /> Telat</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-blue-400" /> Izin</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-rose-500" /> Alpa</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-slate-400" /> Libur</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" /> Blm Absen</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {!selectedUserId ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-slate-400">
            <CalendarCheck size={40} className="mb-3" />
            <p className="text-sm font-medium text-slate-500">Pilih karyawan dan tekan Tampilkan</p>
          </div>
        ) : loading ? (
          <div className="px-4 py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : (
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {DAY_NAMES.map((name) => (
                <div key={name} className="border-r border-slate-200 px-2 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase last:border-r-0">
                  {name}
                </div>
              ))}
            </div>
            {/* Body */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="border-b border-r border-slate-100 bg-slate-50/50 last:border-r-0" />;
                }
                const ds = dateStr(day);
                const dayData = rekapData[ds];
                const isEmpty = !dayData || dayData.shifts.length === 0;

                return (
                  <div
                    key={ds}
                    className={`relative min-h-[70px] border-b border-r border-slate-100 p-1.5 transition last:border-r-0 ${isEmpty ? "bg-slate-50/30" : "cursor-pointer hover:bg-slate-50"}`}
                    onClick={() => dayData && handleCellClick(ds, dayData)}
                    title={dayData ? dayData.shifts.map((s) => `${s.shift_nama}: ${s.status}`).join(", ") : ""}
                  >
                    <span className={`text-[10px] font-bold ${isEmpty ? "text-slate-300" : "text-slate-600"}`}>
                      {day}
                    </span>
                    {dayData?.shifts.map((sh, si) => (
                      <div
                        key={si}
                        className={`mt-0.5 inline-flex items-center justify-center rounded px-1 py-0.5 text-[9px] font-bold leading-tight ${statusColorClass(sh.status)}`}
                        style={{ minWidth: 16, minHeight: 16 }}
                      >
                        {sh.initial}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Ubah Status</h3>
              <button
                onClick={() => setModal({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false })}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="mb-1 text-xs text-slate-500">Tanggal</p>
              <p className="mb-3 text-sm font-semibold text-slate-800">{modal.tanggal}</p>
              <p className="mb-1 text-xs text-slate-500">Shift</p>
              <p className="mb-3 text-sm font-semibold text-slate-800">{modal.shift.shift_nama}</p>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <select
                value={modal.shift.status}
                onChange={(e) => setModal((prev) => ({ ...prev, shift: { ...prev.shift, status: e.target.value } }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => setModal({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false })}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={modal.submitting}
                className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {modal.submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColorClass(status: string): string {
  switch (status) {
    case "HADIR": return "bg-emerald-500 text-white";
    case "TERLAMBAT": return "bg-amber-400 text-white";
    case "IZIN": return "bg-blue-400 text-white";
    case "ALPA":
    case "TIDAK ABSEN PULANG": return "bg-rose-500 text-white";
    case "LIBUR": return "bg-slate-400 text-white";
    default: return "border border-slate-300 bg-white text-slate-600";
  }
}
