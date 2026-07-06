import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, RotateCcw, X } from "lucide-react";
import { rekapKehadiranSenseiApi } from "../../services/api";
import type { RekapKehadiranSenseiDay, KelasSenseiInfo, Karyawan } from "../../types";

const MONTHS_IND = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STATUS_OPTIONS = [
  { value: "HADIR", label: "Hadir" },
  { value: "TERLAMBAT", label: "Terlambat" },
  { value: "ALPA", label: "Alpa" },
  { value: "PULANG LEBIH AWAL", label: "Pulang Lebih Awal" },
  { value: "TIDAK ABSEN PULANG", label: "Tidak Absen Pulang" },
  { value: "LIBUR", label: "Libur" },
];

export default function RekapKehadiranSenseiPage() {
  const now = new Date();
  const [rekapData, setRekapData] = useState<Record<string, RekapKehadiranSenseiDay>>({});
  const [kelasList, setKelasList] = useState<KelasSenseiInfo[]>([]);
  const [senseiList, setSenseiList] = useState<Karyawan[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [senseiLoading, setSenseiLoading] = useState(true);

  const [modal, setModal] = useState<{
    show: boolean;
    absensi_id: number;
    kelas_nama: string;
    status: string;
    submitting: boolean;
  }>({ show: false, absensi_id: 0, kelas_nama: "", status: "HADIR", submitting: false });

  useEffect(() => {
    rekapKehadiranSenseiApi.listSensei()
      .then((res) => setSenseiList(res.data.data || []))
      .catch(console.error)
      .finally(() => setSenseiLoading(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await rekapKehadiranSenseiApi.getRekap(selectedUserId, { bulan, tahun });
      setRekapData(res.data.data || {});
      setKelasList(res.data.kelas_list || []);
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

  const handleCellClick = (tanggal: string, dayData: RekapKehadiranSenseiDay) => {
    if (!dayData.entries.length) return;
    const e = dayData.entries[0];
    setModal({
      show: true,
      absensi_id: e.absensi_id,
      kelas_nama: e.kelas_nama,
      status: e.status === "BELUM ABSEN" ? "HADIR" : e.status,
      submitting: false,
    });
  };

  const handleUpdateStatus = async () => {
    setModal((prev) => ({ ...prev, submitting: true }));
    try {
      await rekapKehadiranSenseiApi.updateStatus({ id: modal.absensi_id, status: modal.status });
      setModal({ show: false, absensi_id: 0, kelas_nama: "", status: "HADIR", submitting: false });
      fetchData();
    } catch (err) {
      console.error(err);
      setModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getSummary = () => {
    const s = { hadir: 0, terlambat: 0, alpa: 0, pulangAwal: 0, libur: 0, belumAbsen: 0 };
    Object.values(rekapData).forEach((day) => {
      day.entries.forEach((e) => {
        if (e.status === "HADIR") s.hadir++;
        else if (e.status === "TERLAMBAT") s.terlambat++;
        else if (e.status === "ALPA" || e.status === "TIDAK ABSEN PULANG") s.alpa++;
        else if (e.status === "PULANG LEBIH AWAL") s.pulangAwal++;
        else if (e.status === "LIBUR") s.libur++;
        else s.belumAbsen++;
      });
    });
    return s;
  };

  const s = getSummary();

  const selectedSensei = senseiList.find((k) => k.id === selectedUserId);

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Rekap Kehadiran Sensei</h1>
            <p className="text-sm text-slate-500">Rekapitulasi kehadiran sensei per bulan</p>
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
            <option value="">Pilih Sensei</option>
            {senseiList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} - {k.divisi?.nama_divisi || "-"}
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
              setKelasList([]);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Kelas Info Cards */}
      {kelasList.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((k) => (
            <div key={k.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-bold text-slate-700">{k.nama_kelas}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">Level {k.level}</div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">
                  {k.tanggal_mulai} - {k.tanggal_selesai}
                </span>
                <span className="font-semibold text-slate-700">
                  {k.jumlah_absen}/{k.total_pertemuan} absen
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-emerald-600">{s.hadir}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hadir</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-amber-600">{s.terlambat}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Telat</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-rose-600">{s.alpa}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Alpa</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-orange-600">{s.pulangAwal}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">P.Awal</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-500">{s.libur}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Libur</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && Object.keys(rekapData).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> Hadir</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-amber-400" /> Telat</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-rose-500" /> Alpa</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-orange-400" /> P.Awal</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-slate-400" /> Libur</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" /> Blm Absen</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#fff3cd" }} /> Rentang Kelas</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {!selectedUserId ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-slate-400">
            <BarChart3 size={40} className="mb-3" />
            <p className="text-sm font-medium text-slate-500">Pilih sensei dan tekan Tampilkan</p>
          </div>
        ) : loading ? (
          <div className="px-4 py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : Object.keys(rekapData).length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-slate-400">
            <BarChart3 size={40} className="mb-3" />
            <p className="text-sm font-medium text-slate-500">Tidak ada data kehadiran untuk bulan ini</p>
          </div>
        ) : (
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {DAY_NAMES.map((name) => (
                <div key={name} className="border-r border-slate-200 px-2 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase last:border-r-0">
                  {name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="border-b border-r border-slate-100 bg-slate-50/50 last:border-r-0" />;
                }
                const ds = dateStr(day);
                const dayData = rekapData[ds];
                const inClassRange = dayData?.in_class_range ?? (kelasList.some((k) => ds >= k.tanggal_mulai && ds <= k.tanggal_selesai));

                return (
                  <div
                    key={ds}
                    className={`relative min-h-[70px] border-b border-r border-slate-100 p-1.5 transition last:border-r-0 ${dayData ? "cursor-pointer hover:bg-slate-50" : ""} ${inClassRange && !dayData ? "bg-amber-50/50" : ""} ${!inClassRange && !dayData ? "bg-slate-50/30" : ""}`}
                    onClick={() => dayData && handleCellClick(ds, dayData)}
                    title={dayData ? dayData.entries.map((e) => `${e.kelas_nama}: ${e.status}`).join(", ") : (inClassRange ? "Rentang kelas" : "")}
                    style={dayData?.in_class_range && !dayData.entries.length ? { backgroundColor: "#fff3cd" } : (!dayData && inClassRange ? { backgroundColor: "#fff3cd" } : undefined)}
                  >
                    <span className={`text-[10px] font-bold ${dayData ? "text-slate-600" : inClassRange ? "text-amber-700" : "text-slate-300"}`}>
                      {day}
                    </span>
                    {dayData?.entries.map((e, ei) => (
                      <div
                        key={ei}
                        className={`mt-0.5 inline-flex items-center justify-center rounded px-1 py-0.5 text-[9px] font-bold leading-tight ${statusColorClass(e.status)}`}
                        style={{ minWidth: 16, minHeight: 16 }}
                      >
                        {e.initial}
                      </div>
                    ))}
                    {!dayData && inClassRange && (
                      <div className="mt-0.5 text-center text-[8px] text-amber-500 font-medium">-</div>
                    )}
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
                onClick={() => setModal({ show: false, absensi_id: 0, kelas_nama: "", status: "HADIR", submitting: false })}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="mb-1 text-xs text-slate-500">Kelas</p>
              <p className="mb-3 text-sm font-semibold text-slate-800">{modal.kelas_nama}</p>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <select
                value={modal.status}
                onChange={(e) => setModal((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => setModal({ show: false, absensi_id: 0, kelas_nama: "", status: "HADIR", submitting: false })}
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
    case "ALPA":
    case "TIDAK ABSEN PULANG": return "bg-rose-500 text-white";
    case "PULANG LEBIH AWAL": return "bg-orange-400 text-white";
    case "LIBUR": return "bg-slate-400 text-white";
    default: return "border border-slate-300 bg-white text-slate-600";
  }
}
