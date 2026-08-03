import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, RotateCcw, X, ChevronDown, ChevronUp, Image, Users, CheckCircle, Clock, LogOut, XCircle, User, CalendarDays, MapPin } from "lucide-react";
import { kehadiranSenseiApi, APP_URL } from "../../services/api";
import type { KehadiranSenseiGroup, Karyawan } from "../../types";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "HADIR", label: "Hadir" },
  { value: "TERLAMBAT", label: "Terlambat" },
  { value: "ALPA", label: "Alpa" },
  { value: "PULANG LEBIH AWAL", label: "Pulang Cepat" },
  { value: "TIDAK ABSEN PULANG", label: "Tidak Pulang" },
  { value: "LIBUR", label: "Libur" },
];

const STATUS_LABEL: Record<string, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  ALPA: "Alpa",
  "PULANG LEBIH AWAL": "Pulang Cepat",
  "TIDAK ABSEN PULANG": "Tidak Pulang",
  LIBUR: "Libur",
};

const STATUS_STYLE: Record<string, string> = {
  HADIR: "bg-emerald-100 text-emerald-700",
  TERLAMBAT: "bg-amber-100 text-amber-700",
  ALPA: "bg-rose-100 text-rose-700",
  "PULANG LEBIH AWAL": "bg-orange-100 text-orange-700",
  "TIDAK ABSEN PULANG": "bg-rose-100 text-rose-700",
  LIBUR: "bg-slate-100 text-slate-500",
  "": "bg-slate-100 text-slate-500",
};

const STATUS_DOT: Record<string, string> = {
  HADIR: "bg-emerald-500",
  TERLAMBAT: "bg-amber-500",
  ALPA: "bg-rose-500",
  "PULANG LEBIH AWAL": "bg-orange-500",
  "TIDAK ABSEN PULANG": "bg-rose-500",
  LIBUR: "bg-slate-400",
  "": "bg-slate-300",
};

const fmtDate = (t?: string) => {
  if (!t) return "-";
  const d = new Date(t.length <= 10 ? `${t}T00:00:00` : t);
  if (isNaN(d.getTime())) return t.slice(0, 10);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" });
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function DataKehadiranSenseiPage() {
  const now = new Date();
  const [groups, setGroups] = useState<KehadiranSenseiGroup[]>([]);
  const [rekap, setRekap] = useState({ total: 0, hadir: 0, terlambat: 0, pulang_cepat: 0, tidak_absen_pulang: 0 });
  const [listSensei, setListSensei] = useState<Karyawan[]>([]);
  const [listBatch, setListBatch] = useState<{ id: number; nama_batch: string; warna: string | null; cabang_id: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const levels = [1, 2, 3, 4];

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterSensei, setFilterSensei] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const [editModal, setEditModal] = useState<{
    show: boolean;
    absensi_id: number;
    status: string;
    submitting: boolean;
  }>({ show: false, absensi_id: 0, status: "HADIR", submitting: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (filterSensei) params.user_id = filterSensei;
      if (filterBatch) params.batch_id = filterBatch;
      if (filterLevel) params.level = filterLevel;
      if (filterStatus) params.status = filterStatus;
      const res = await kehadiranSenseiApi.list(params);
      setGroups(res.data.data || []);
      setRekap(res.data.rekap || { total: 0, hadir: 0, terlambat: 0, pulang_cepat: 0, tidak_absen_pulang: 0 });
      setListSensei(res.data.list_sensei || []);
      setListBatch(res.data.list_batch || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterSensei, filterBatch, filterLevel, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilter = () => {
    const d = new Date();
    const sd = new Date(d.getFullYear(), d.getMonth(), 1);
    setStartDate(sd.toISOString().split("T")[0]);
    setEndDate(d.toISOString().split("T")[0]);
    setFilterSensei("");
    setFilterBatch("");
    setFilterLevel("");
    setFilterStatus("");
  };

  const toggleGroup = (kelasId: number) => {
    setExpandedGroups((prev) => ({ ...prev, [kelasId]: !prev[kelasId] }));
  };

  const handleEditStatus = async () => {
    setEditModal((prev) => ({ ...prev, submitting: true }));
    try {
      await kehadiranSenseiApi.updateStatus({ id: editModal.absensi_id, status: editModal.status });
      setEditModal({ show: false, absensi_id: 0, status: "HADIR", submitting: false });
      fetchData();
    } catch (err) {
      console.error(err);
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const statusBadge = (status: string) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[status] || STATUS_STYLE[""]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || STATUS_DOT[""]}`} />
      {STATUS_LABEL[status] || status || "-"}
    </span>
  );

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kehadiran Sensei</h1>
            <p className="text-sm text-slate-500">Data kehadiran sensei per batch</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Sensei</label>
            <select value={filterSensei} onChange={(e) => setFilterSensei(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]">
              <option value="">Semua Sensei</option>
              {listSensei.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
            <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]">
              <option value="">Semua Batch</option>
              {listBatch.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]">
              <option value="">Semua Level</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={fetchData} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0E6187] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#0a4e6d]">
            <Search size={16} /> Filter
          </button>
          <button onClick={resetFilter} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Statistik */}
      {!loading && groups.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-slate-800">{rekap.total}</span>
              <p className="truncate text-[11px] font-semibold text-slate-500">Total Kehadiran</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-slate-800">{rekap.hadir}</span>
              <p className="truncate text-[11px] font-semibold text-slate-500">Hadir</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-slate-800">{rekap.terlambat}</span>
              <p className="truncate text-[11px] font-semibold text-slate-500">Terlambat</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <LogOut size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-slate-800">{rekap.pulang_cepat}</span>
              <p className="truncate text-[11px] font-semibold text-slate-500">Pulang Cepat</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <XCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-slate-800">{rekap.tidak_absen_pulang}</span>
              <p className="truncate text-[11px] font-semibold text-slate-500">Tidak Pulang</p>
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">Memuat data...</div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <ClipboardList size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Tidak ada data kehadiran sensei</p>
          <p className="text-xs text-slate-400">Coba ubah rentang tanggal atau filter</p>
        </div>
      ) : (
        groups.map((group) => {
          const isOpen = expandedGroups[group.kelas.id];
          const batchInfo = listBatch.find((b) => b.id === group.kelas.batch_relasi?.id);
          const batchColor = batchInfo?.warna || "#0E6187";
          const senseiName = group.kelas.user?.name || group.absensis[0]?.user?.name || "-";
          const pct = group.total > 0 ? Math.min(100, Math.round((group.stats.total_absen / group.total) * 100)) : 0;
          return (
            <div key={group.kelas.id} className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Group Header */}
              <div
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 transition hover:bg-slate-50"
                onClick={() => toggleGroup(group.kelas.id)}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: batchColor }}
                >
                  {initials(group.kelas.nama_kelas)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-slate-800">
                      {group.kelas.batch_relasi?.nama_batch || group.kelas.nama_kelas}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Level {group.kelas.level}
                    </span>
                    <span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:inline-flex">
                      <CalendarDays size={11} />
                      {fmtDate(group.kelas.tanggal_mulai)} - {fmtDate(group.kelas.tanggal_selesai)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <User size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate font-medium">{senseiName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate text-slate-400">{group.kelas.nama_kelas}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {group.stats.hadir} Hadir
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {group.stats.terlambat} Terlambat
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {group.stats.alpa} Alpa
                  </span>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{pct}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {group.stats.total_absen}/{group.total} pertemuan
                  </span>
                </div>
                <span className="shrink-0 text-slate-400">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {/* Group Body */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs text-slate-700">
                    <thead className="bg-[#0E6187] text-[10px] text-white uppercase tracking-wide">
                      <tr>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold">#</th>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold">Tanggal</th>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold">Jam Masuk</th>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold">Jam Pulang</th>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold">Status</th>
                        <th className="border-b border-slate-600 px-3 py-2.5 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.absensis.map((item, idx) => (
                        <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                          <td className="border-b border-slate-50 px-3 py-2 text-slate-400">{item.pertemuan_ke || idx + 1}</td>
                          <td className="border-b border-slate-50 px-3 py-2">
                            <span className="font-medium text-slate-700">{fmtDate(item.tanggal)}</span>
                          </td>
                          <td className="border-b border-slate-50 px-3 py-2">
                            {item.jam_masuk ? (
                              <span className="inline-flex items-center gap-1">
                                {item.foto_masuk && (
                                  <a href={`${APP_URL}/uploads/sensei/${item.foto_masuk}`} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-500">
                                    <Image size={12} />
                                  </a>
                                )}
                                <span className="font-medium text-emerald-600">{item.jam_masuk}</span>
                              </span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border-b border-slate-50 px-3 py-2">
                            {item.jam_keluar ? (
                              <span className="inline-flex items-center gap-1">
                                {item.foto_pulang && (
                                  <a href={`${APP_URL}/uploads/sensei/${item.foto_pulang}`} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-500">
                                    <Image size={12} />
                                  </a>
                                )}
                                <span className="font-medium text-rose-600">{item.jam_keluar}</span>
                              </span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="border-b border-slate-50 px-3 py-2">{statusBadge(item.status)}</td>
                          <td className="border-b border-slate-50 px-3 py-2 text-center">
                            <button
                              onClick={() => setEditModal({ show: true, absensi_id: item.id, status: item.status === "BELUM ABSEN" ? "HADIR" : item.status, submitting: false })}
                              className="inline-flex items-center rounded-md border border-[#0E6187]/20 bg-[#0E6187]/5 px-2.5 py-1 text-[10px] font-semibold text-[#0E6187] transition hover:bg-[#0E6187] hover:text-white"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Edit Status</h3>
              <button onClick={() => setEditModal({ show: false, absensi_id: 0, status: "HADIR", submitting: false })} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <select
                value={editModal.status}
                onChange={(e) => setEditModal((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button onClick={() => setEditModal({ show: false, absensi_id: 0, status: "HADIR", submitting: false })} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleEditStatus} disabled={editModal.submitting} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
                {editModal.submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

