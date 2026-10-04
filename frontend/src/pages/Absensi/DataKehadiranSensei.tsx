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
  HADIR: "bg-[#ceead6] text-[#137333]",
  TERLAMBAT: "bg-[#fef7e0] text-[#b06000]",
  ALPA: "bg-[#f6d7d5] text-[#a50e0e]",
  "PULANG LEBIH AWAL": "bg-[#fef7e0] text-[#b06000]",
  "TIDAK ABSEN PULANG": "bg-[#f6d7d5] text-[#a50e0e]",
  LIBUR: "bg-[#f1f3f4] text-[#5f6368]",
  "": "bg-[#f1f3f4] text-[#5f6368]",
};

const STATUS_DOT: Record<string, string> = {
  HADIR: "bg-[#188038]",
  TERLAMBAT: "bg-[#e37400]",
  ALPA: "bg-[#d93025]",
  "PULANG LEBIH AWAL": "bg-[#e37400]",
  "TIDAK ABSEN PULANG": "bg-[#d93025]",
  LIBUR: "bg-[#bdc1c6]",
  "": "bg-[#e8eaed]",
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[status] || STATUS_STYLE[""]}`}>
      <span className={`h-1.5 w-1.5 ${STATUS_DOT[status] || STATUS_DOT[""]}`} />
      {STATUS_LABEL[status] || status || "-"}
    </span>
  );

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Kehadiran Sensei</h1>
            <p className="text-sm text-[#5f6368]">Data kehadiran sensei per batch</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 border border-[#dadce0] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Sensei</label>
            <select value={filterSensei} onChange={(e) => setFilterSensei(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              <option value="">Semua Sensei</option>
              {listSensei.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
            <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              <option value="">Semua Batch</option>
              {listBatch.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              <option value="">Semua Level</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={fetchData} className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#202124]">
            <Search size={16} /> Filter
          </button>
          <button onClick={resetFilter} className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Statistik */}
      {!loading && groups.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3 border border-[#dadce0] bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f1f3f4] text-[#5f6368]">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-[#202124]">{rekap.total}</span>
              <p className="truncate text-[11px] font-semibold text-[#5f6368]">Total Kehadiran</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-[#dadce0] bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#e6f4ea] text-[#137333]">
              <CheckCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-[#202124]">{rekap.hadir}</span>
              <p className="truncate text-[11px] font-semibold text-[#5f6368]">Hadir</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-[#dadce0] bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fef7e0] text-[#b06000]">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-[#202124]">{rekap.terlambat}</span>
              <p className="truncate text-[11px] font-semibold text-[#5f6368]">Terlambat</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-[#dadce0] bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fef7e0] text-[#b06000]">
              <LogOut size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-[#202124]">{rekap.pulang_cepat}</span>
              <p className="truncate text-[11px] font-semibold text-[#5f6368]">Pulang Cepat</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-[#dadce0] bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fce8e6] text-[#c5221f]">
              <XCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-[#202124]">{rekap.tidak_absen_pulang}</span>
              <p className="truncate text-[11px] font-semibold text-[#5f6368]">Tidak Pulang</p>
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="border border-[#dadce0] p-8 text-center text-sm text-[#80868b]">Memuat data...</div>
      ) : groups.length === 0 ? (
        <div className="border border-[#dadce0] p-8 text-center">
          <ClipboardList size={32} className="mx-auto mb-2 text-[#9aa0a6]" />
          <p className="text-sm font-medium text-[#5f6368]">Tidak ada data kehadiran sensei</p>
          <p className="text-xs text-[#80868b]">Coba ubah rentang tanggal atau filter</p>
        </div>
      ) : (
        groups.map((group) => {
          const isOpen = expandedGroups[group.kelas.id];
          const batchInfo = listBatch.find((b) => b.id === group.kelas.batch_relasi?.id);
          const batchColor = batchInfo?.warna || "#0E6187";
          const senseiName = group.kelas.user?.name || group.absensis[0]?.user?.name || "-";
          const pct = group.total > 0 ? Math.min(100, Math.round((group.stats.total_absen / group.total) * 100)) : 0;
          return (
            <div key={group.kelas.id} className="mb-4 overflow-hidden border border-[#dadce0] bg-white">
              {/* Group Header */}
              <div
                className="flex cursor-pointer items-center gap-3 border-b border-[#e8eaed] bg-[#f8f9fa] px-4 py-3 transition hover:bg-[#f8f9fa]"
                onClick={() => toggleGroup(group.kelas.id)}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: batchColor }}
                >
                  {initials(group.kelas.nama_kelas)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-[#202124]">
                      {group.kelas.batch_relasi?.nama_batch || group.kelas.nama_kelas}
                    </span>
                    <span className="inline-flex items-center bg-[#e8eaed] px-2 py-0.5 text-[10px] font-semibold text-[#5f6368]">
                      Level {group.kelas.level}
                    </span>
                    <span className="hidden items-center gap-1 text-[10px] text-[#80868b] sm:inline-flex">
                      <CalendarDays size={11} />
                      {fmtDate(group.kelas.tanggal_mulai)} - {fmtDate(group.kelas.tanggal_selesai)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5f6368]">
                    <User size={12} className="shrink-0 text-[#80868b]" />
                    <span className="truncate font-medium">{senseiName}</span>
                    <span className="text-[#9aa0a6]">·</span>
                    <span className="truncate text-[#80868b]">{group.kelas.nama_kelas}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 bg-[#0E6187] px-2 py-0.5 font-semibold text-white">
                    <span className="h-1.5 w-1.5 bg-[#0E6187]" /> {group.stats.hadir} Hadir
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#fef7e0] px-2 py-0.5 font-semibold text-[#b06000]">
                    <span className="h-1.5 w-1.5 bg-[#e37400]" /> {group.stats.terlambat} Terlambat
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#f6d7d5] px-2 py-0.5 font-semibold text-[#a50e0e]">
                    <span className="h-1.5 w-1.5 bg-[#d93025]" /> {group.stats.alpa} Alpa
                  </span>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden bg-[#e8eaed]">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#188038" : pct >= 50 ? "#e37400" : "#d93025" }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#80868b]">{pct}%</span>
                  </div>
                  <span className="text-[10px] text-[#80868b]">
                    {group.stats.total_absen}/{group.total} pertemuan
                  </span>
                </div>
                <span className="shrink-0 text-[#80868b]">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {/* Group Body */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs text-[#3c4043]">
                    <thead className="text-[10px] text-white">
                      <tr>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">#</th>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Tanggal</th>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Jam Masuk</th>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Jam Pulang</th>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Status</th>
                        <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.absensis.map((item, idx) => (
                        <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2 text-[#80868b]">{item.pertemuan_ke || idx + 1}</td>
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2">
                            <span className="font-medium text-[#3c4043]">{fmtDate(item.tanggal)}</span>
                          </td>
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2">
                            {item.jam_masuk ? (
                              <span className="inline-flex items-center gap-1">
                                {item.foto_masuk && (
                                  <a href={`${APP_URL}/uploads/sensei/${item.foto_masuk}`} target="_blank" rel="noopener noreferrer" className="text-[#9aa0a6] hover:text-[#5f6368]">
                                    <Image size={12} />
                                  </a>
                                )}
                                <span className="font-medium text-[#137333]">{item.jam_masuk}</span>
                              </span>
                            ) : <span className="text-[#9aa0a6]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2">
                            {item.jam_keluar ? (
                              <span className="inline-flex items-center gap-1">
                                {item.foto_pulang && (
                                  <a href={`${APP_URL}/uploads/sensei/${item.foto_pulang}`} target="_blank" rel="noopener noreferrer" className="text-[#9aa0a6] hover:text-[#5f6368]">
                                    <Image size={12} />
                                  </a>
                                )}
                                <span className="font-medium text-[#c5221f]">{item.jam_keluar}</span>
                              </span>
                            ) : <span className="text-[#9aa0a6]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2">{statusBadge(item.status)}</td>
                          <td className="border-b border-[#e8eaed] border-b px-3 py-2 text-center">
                            <button
                              onClick={() => setEditModal({ show: true, absensi_id: item.id, status: item.status === "BELUM ABSEN" ? "HADIR" : item.status, submitting: false })}
                              className="inline-flex items-center border border-[#1a73e8] bgbg-[#f8f9fa] px-2.5 py-1 text-[10px] font-semibold text-[#1a73e8] transition hover:bg-[#0a4d6b] hover:text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124] px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Edit Status</h3>
              <button onClick={() => setEditModal({ show: false, absensi_id: 0, status: "HADIR", submitting: false })} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <label className="mb-1 block text-xs text-[#5f6368]">Status</label>
              <select
                value={editModal.status}
                onChange={(e) => setEditModal((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button onClick={() => setEditModal({ show: false, absensi_id: 0, status: "HADIR", submitting: false })} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
              <button onClick={handleEditStatus} disabled={editModal.submitting} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">
                {editModal.submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

