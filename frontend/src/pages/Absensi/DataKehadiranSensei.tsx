import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, RotateCcw, X, ChevronDown, ChevronUp, Image } from "lucide-react";
import { kehadiranSenseiApi, APP_URL } from "../../services/api";
import type { KehadiranSenseiGroup, Karyawan } from "../../types";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "HADIR", label: "Hadir" },
  { value: "TERLAMBAT", label: "Terlambat" },
  { value: "ALPA", label: "Alpa" },
  { value: "PULANG LEBIH AWAL", label: "Pulang Lebih Awal" },
  { value: "TIDAK ABSEN PULANG", label: "Tidak Absen Pulang" },
  { value: "LIBUR", label: "Libur" },
];

const STATUS_STYLE: Record<string, string> = {
  HADIR: "bg-emerald-100 text-emerald-700",
  TERLAMBAT: "bg-amber-100 text-amber-700",
  ALPA: "bg-rose-100 text-rose-700",
  "PULANG LEBIH AWAL": "bg-orange-100 text-orange-700",
  "TIDAK ABSEN PULANG": "bg-rose-100 text-rose-700",
  LIBUR: "bg-slate-100 text-slate-500",
  "": "bg-slate-100 text-slate-500",
};

export default function DataKehadiranSenseiPage() {
  const now = new Date();
  const [groups, setGroups] = useState<KehadiranSenseiGroup[]>([]);
  const [rekap, setRekap] = useState({ total: 0, hadir: 0, terlambat: 0, pulang_cepat: 0, tidak_absen_pulang: 0 });
  const [listSensei, setListSensei] = useState<Karyawan[]>([]);
  const [listBatch, setListBatch] = useState<{ id: number; nama_batch: string }[]>([]);
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
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[status] || STATUS_STYLE[""]}`}>
      {status || "-"}
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
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Dari</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Sampai</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={filterSensei} onChange={(e) => setFilterSensei(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Sensei</option>
            {listSensei.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Batch</option>
            {listBatch.map((b) => (
              <option key={b.id} value={b.id}>{b.nama_batch}</option>
            ))}
          </select>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Level</option>
            {levels.map((l) => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={fetchData} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
            <Search size={16} /> Filter
          </button>
          <button onClick={resetFilter} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Statistik */}
      {!loading && groups.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">{rekap.total}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-emerald-600">{rekap.hadir}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hadir</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-amber-600">{rekap.terlambat}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Telat</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-orange-600">{rekap.pulang_cepat}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">P.Cepat</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-rose-600">{rekap.tidak_absen_pulang}</span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Tdk Pulang</p>
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
          return (
            <div key={group.kelas.id} className="mb-4 rounded-lg border border-slate-200 shadow-sm">
              {/* Group Header */}
              <div
                className="flex cursor-pointer items-center justify-between bg-slate-50 px-4 py-2.5"
                onClick={() => toggleGroup(group.kelas.id)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{group.kelas.batch_relasi?.nama_batch || group.kelas.nama_kelas}</span>
                    <span className="ml-2 text-[10px] text-slate-400">Level {group.kelas.level}</span>
                    {group.kelas.user && <span className="ml-2 text-[10px] text-slate-500">- {group.kelas.user.name}</span>}
                  </div>
                  <div className="flex gap-1 text-[9px]">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">{group.stats.hadir} H</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">{group.stats.terlambat} T</span>
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-700">{group.stats.alpa} A</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {group.stats.total_absen}/{group.total} pertemuan
                  </span>
                  {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </div>

              {/* Group Body */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs text-slate-700">
                    <thead className="bg-white text-[10px] text-slate-500 uppercase tracking-wide">
                      <tr>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold">#</th>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold">Tanggal</th>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold">Jam Masuk</th>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold">Jam Pulang</th>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold">Status</th>
                        <th className="border-b border-slate-100 px-3 py-2 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.absensis.map((item, idx) => (
                        <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                          <td className="border-b border-slate-50 px-3 py-2 text-slate-400">{item.pertemuan_ke || idx + 1}</td>
                          <td className="border-b border-slate-50 px-3 py-2">
                            <span className="font-medium text-slate-700">{item.tanggal?.slice(0, 10) || item.tanggal}</span>
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
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[9px] font-medium text-slate-600 transition hover:bg-slate-100"
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

