import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Search, RotateCcw, X } from "lucide-react";
import { rekapJadwalShiftApi, karyawanApi, shiftApi } from "../../services/api";
import type { RekapJadwalShiftDay, Karyawan, Shift } from "../../types";

const MONTHS_IND = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STATUS_OPTIONS = [
  { value: "HADIR", label: "Hadir", color: "text-[#137333]" },
  { value: "TERLAMBAT", label: "Terlambat", color: "text-[#b06000]" },
  { value: "IZIN", label: "Izin", color: "text-[#1a73e8]" },
  { value: "ALPA", label: "Alpa", color: "text-[#c5221f]" },
  { value: "PULANG LEBIH AWAL", label: "Pulang Lebih Awal", color: "text-[#b06000]" },
  { value: "TIDAK ABSEN PULANG", label: "Tidak Absen Pulang", color: "text-[#c5221f]" },
  { value: "LIBUR", label: "Libur", color: "text-[#5f6368]" },
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
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Rekap Jadwal Shift</h1>
            <p className="text-sm text-[#5f6368]">Kalender kehadiran per karyawan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
            className="min-w-[200px] border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
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
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
          >
            {MONTHS_IND.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={!selectedUserId || loading}
            className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50"
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
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#137333]">{s.hadir}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Hadir</p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#b06000]">{s.terlambat}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Telat</p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#1a73e8]">{s.izin}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Izin</p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#c5221f]">{s.alpa}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Alpa</p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#5f6368]">{s.libur}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Libur</p>
          </div>
          <div className="border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">{s.belumAbsen}</span>
            <p className="text-[10px] font-bold tracking-wider text-[#5f6368] uppercase">Blm Absen</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 bg-[#0E6187]" /> Hadir</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 bg-[#f9ab00]" /> Telat</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 bg-[#0E6187]" /> Izin</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 bg-[#d93025]" /> Alpa</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 bg-[#bdc1c6]" /> Libur</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 border border-[#dadce0] bg-white" /> Blm Absen</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto border border-[#dadce0]">
        {!selectedUserId ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-[#80868b]">
            <CalendarCheck size={40} className="mb-3" />
            <p className="text-sm font-medium text-[#5f6368]">Pilih karyawan dan tekan Tampilkan</p>
          </div>
        ) : loading ? (
          <div className="px-4 py-16 text-center text-sm text-[#80868b]">Memuat data...</div>
        ) : (
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-[#dadce0] bg-[#f8f9fa]">
              {DAY_NAMES.map((name) => (
                <div key={name} className="border-r border-[#dadce0] px-2 py-2 text-center text-[10px] font-bold tracking-wider text-[#5f6368] uppercase last:border-r-0">
                  {name}
                </div>
              ))}
            </div>
            {/* Body */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="border-b border-r border-[#e8eaed] bg-[#f8f9fa] last:border-r-0" />;
                }
                const ds = dateStr(day);
                const dayData = rekapData[ds];
                const isEmpty = !dayData || dayData.shifts.length === 0;

                return (
                  <div
                    key={ds}
                    className={`relative min-h-[70px] border-b border-r border-[#e8eaed] p-1.5 transition last:border-r-0 ${isEmpty ? "bg-[#f8f9fa]" : "cursor-pointer hover:bg-[#f8f9fa]"}`}
                    onClick={() => dayData && handleCellClick(ds, dayData)}
                    title={dayData ? dayData.shifts.map((s) => `${s.shift_nama}: ${s.status}`).join(", ") : ""}
                  >
                    <span className={`text-[10px] font-bold ${isEmpty ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                      {day}
                    </span>
                    {dayData?.shifts.map((sh, si) => (
                      <div
                        key={si}
                        className={`mt-0.5 inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-bold leading-tight ${statusColorClass(sh.status)}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124] px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Ubah Status</h3>
              <button
                onClick={() => setModal({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false })}
                className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="mb-1 text-xs text-[#5f6368]">Tanggal</p>
              <p className="mb-3 text-sm font-semibold text-[#202124]">{modal.tanggal}</p>
              <p className="mb-1 text-xs text-[#5f6368]">Shift</p>
              <p className="mb-3 text-sm font-semibold text-[#202124]">{modal.shift.shift_nama}</p>
              <label className="mb-1 block text-xs text-[#5f6368]">Status</label>
              <select
                value={modal.shift.status}
                onChange={(e) => setModal((prev) => ({ ...prev, shift: { ...prev.shift, status: e.target.value } }))}
                className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button
                onClick={() => setModal({ show: false, tanggal: "", shift: { shift_id: null, shift_nama: "", status: "" }, submitting: false })}
                className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={modal.submitting}
                className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50"
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
    case "HADIR": return "bg-[#188038] text-white";
    case "TERLAMBAT": return "bg-[#f9ab00] text-white";
    case "IZIN": return "bg-[#0E6187] text-white";
    case "ALPA":
    case "TIDAK ABSEN PULANG": return "bg-[#d93025] text-white";
    case "LIBUR": return "bg-[#bdc1c6] text-white";
    default: return "border border-[#dadce0] bg-white text-[#5f6368]";
  }
}
