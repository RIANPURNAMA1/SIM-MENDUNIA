import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Calendar, Plus, Pencil, Trash2, X, ChevronLeft, Building2, Layers, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { jadwalLevelApi, adminCabangApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { BatchData, JadwalLevelItem } from "../../types";

interface CabangItem {
  id: number;
  nama_cabang: string;
}

const stages = [
  { level: 1, label: "Level 1" },
  { level: 2, label: "Level 2" },
  { level: 3, label: "Level 3" },
  { level: 4, label: "Level 4" },
];

export default function JadwalLevelPage() {
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const { user } = useAuth();
  const canApprove = !isAdminCabang && ["MANAGER", "HR", "ADMIN"].includes(user?.role || "");
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [cabangs, setCabangs] = useState<CabangItem[]>([]);
  const [jadwalMap, setJadwalMap] = useState<Record<string, JadwalLevelItem>>({});
  const [loading, setLoading] = useState(true);

  const [selectedCabang, setSelectedCabang] = useState<CabangItem | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    batch_id: 0, batch_nama: "", level: 0, levelLabel: "",
    tanggal_mulai: "", tanggal_selesai: "",
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ batch: BatchData; level: number; label: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const buildKey = (batchId: number, level: number) => `${batchId}-${level}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = isAdminCabang ? await adminCabangApi.jadwalLevel() : await jadwalLevelApi.list();
      setBatches(res.data.batches || []);
      setCabangs(res.data.cabangs || []);
      const map: Record<string, JadwalLevelItem> = {};
      const jadwalData = res.data.jadwal || {};
      Object.keys(jadwalData).forEach((key) => {
        map[key] = jadwalData[key];
      });
      setJadwalMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingByBatch: Record<number, number> = {};
  let totalPending = 0;
  Object.values(jadwalMap).forEach((item) => {
    if (item.status === "menunggu") {
      pendingByBatch[item.batch_id] = (pendingByBatch[item.batch_id] || 0) + 1;
      totalPending += 1;
    }
  });

  const pendingSum = (batchList: BatchData[]) =>
    batchList.reduce((sum, b) => sum + (pendingByBatch[b.id] || 0), 0);

  const openModal = (batch: BatchData, level: number, label: string, existing?: JadwalLevelItem) => {
    setForm({
      batch_id: batch.id,
      batch_nama: batch.nama_batch,
      level,
      levelLabel: label,
      tanggal_mulai: existing?.tanggal_mulai || "",
      tanggal_selesai: existing?.tanggal_selesai || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai) return;
    setSubmitting(true);
    try {
      await jadwalLevelApi.store({
        batch_id: form.batch_id,
        level: form.level,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (batch: BatchData, level: number, label: string) => {
    if (!confirm(`Hapus jadwal untuk ${batch.nama_batch} - ${label}?`)) return;
    try {
      await jadwalLevelApi.destroy(batch.id, level);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (batch: BatchData, level: number, label: string) => {
    if (!confirm(`Setujui jadwal ${batch.nama_batch} - ${label}?`)) return;
    try {
      await jadwalLevelApi.approve(batch.id, level);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyetujui jadwal. Coba lagi.");
    }
  };

  const openReject = (batch: BatchData, level: number, label: string) => {
    setRejectTarget({ batch, level, label });
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await jadwalLevelApi.reject(rejectTarget.batch.id, rejectTarget.level, rejectReason);
      setShowRejectModal(false);
      setRejectTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menolak jadwal. Coba lagi.");
    } finally {
      setRejecting(false);
    }
  };

  const statusBadge = (item?: JadwalLevelItem) => {
    if (!item) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">Belum diatur</span>;
    }
    if (item.status === "menunggu") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Menunggu Approval
        </span>
      );
    }
    if (item.status === "disetujui") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
          <Check size={10} />
          Disetujui
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-medium text-rose-700">
        <X size={10} />
        Ditolak
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const batchesByCabang = (cabangId: number) =>
    batches.filter((b) => b.cabang_id === cabangId);

  const cabangTanpaCabang = batches.filter((b) => !b.cabang_id);
  const hasUnassigned = cabangTanpaCabang.length > 0;

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Jadwal Level</h1>
            <p className="text-sm text-slate-500">Atur tanggal mulai dan selesai setiap tahapan per batch, lalu diverifikasi oleh Manager / HR</p>
          </div>
        </div>
      </div>

      {/* Banner pengajuan untuk approver */}
      {canApprove && totalPending > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <ThumbsUp size={14} />
          </div>
          <div className="text-xs text-red-800">
            <p className="font-semibold">
              {totalPending} pengajuan jadwal menunggu persetujuan
            </p>
            <p className="mt-0.5 text-red-600">
              Buka cabang dan batch yang ditandai merah untuk melihat detail lalu menyetujui atau menolak.
            </p>
          </div>
        </div>
      )}

      {/* View: Cabang Cards */}
      {!selectedCabang && !selectedBatch && (
        <>
          {cabangs.length === 0 && !hasUnassigned ? (
            <div className="rounded-lg border border-slate-200 p-8 text-center">
              <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Belum ada batch aktif</p>
              <p className="text-xs text-slate-400">Silakan tambah batch terlebih dahulu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...cabangs]
                .sort((a, b) => pendingSum(batchesByCabang(b.id)) - pendingSum(batchesByCabang(a.id)))
                .map((cabang) => {
                  const pending = pendingSum(batchesByCabang(cabang.id));
                  return (
                    <button
                      key={cabang.id}
                      onClick={() => setSelectedCabang(cabang)}
                      className={`group rounded-lg border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${pending > 0 ? "border-red-300 ring-1 ring-red-100 hover:border-red-400" : "border-slate-200 hover:border-blue-300"}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                          <Building2 size={20} />
                        </div>
                        {pending > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {pending} pengajuan
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">{cabang.nama_cabang}</h3>
                      <p className="mt-1 text-xs text-slate-400">{batchesByCabang(cabang.id).length} batch</p>
                    </button>
                  );
                })}
              {hasUnassigned && (() => {
                const pending = pendingSum(cabangTanpaCabang);
                return (
                  <button
                    onClick={() => setSelectedCabang({ id: 0, nama_cabang: "Tanpa Cabang" })}
                    className={`group rounded-lg border border-dashed bg-white p-4 text-left shadow-sm transition hover:shadow-md ${pending > 0 ? "border-red-300 ring-1 ring-red-100 hover:border-red-400" : "border-slate-300 hover:border-slate-400"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-slate-100">
                        <Building2 size={20} />
                      </div>
                      {pending > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {pending} pengajuan
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600">Tanpa Cabang</h3>
                    <p className="mt-1 text-xs text-slate-400">{cabangTanpaCabang.length} batch</p>
                  </button>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* View: Batch List for selected Cabang */}
      {selectedCabang && !selectedBatch && (
        <div>
          <button
            onClick={() => setSelectedCabang(null)}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
          <h2 className="mb-3 text-base font-semibold text-slate-800">{selectedCabang.nama_cabang}</h2>
          {(() => {
            const list = selectedCabang.id === 0 ? cabangTanpaCabang : batchesByCabang(selectedCabang.id);
            if (list.length === 0) {
              return (
                <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
                  Tidak ada batch di cabang ini
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...list]
                  .sort((a, b) => (pendingByBatch[b.id] || 0) - (pendingByBatch[a.id] || 0))
                  .map((batch) => {
                    const pending = pendingByBatch[batch.id] || 0;
                    return (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedBatch(batch)}
                        className={`group rounded-lg border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${pending > 0 ? "border-red-300 ring-1 ring-red-100 hover:border-red-400" : "border-slate-200 hover:border-emerald-300"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                            <Layers size={20} />
                          </div>
                          {pending > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {pending} pengajuan
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">{batch.nama_batch}</h3>
                        <p className="mt-1 text-xs text-slate-400">{selectedCabang.nama_cabang}</p>
                      </button>
                    );
                  })}
              </div>
            );
          })()}
        </div>
      )}

      {/* View: Jadwal Level Table for selected Batch */}
      {selectedBatch && (
        <div>
          <button
            onClick={() => { setSelectedBatch(null); setSelectedCabang(null); }}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
          <h2 className="mb-3 text-base font-semibold text-slate-800">{selectedBatch.nama_batch}</h2>
          <div className="rounded-lg border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2.5 font-semibold">Tahapan</th>
                    <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Tanggal</th>
                    <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((s) => {
                    const key = buildKey(selectedBatch.id, s.level);
                    const item = jadwalMap[key];
                    return (
                      <tr key={s.level} className="bg-white transition hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2.5 font-semibold text-slate-700">{s.label}</td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center">
                          {item ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex rounded-md bg-emerald-100 px-3 py-1.5 text-[10px] font-medium text-emerald-700 whitespace-nowrap">
                                {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                              </span>
                              {item.status === "ditolak" && item.rejection_reason && (
                                <span className="max-w-[220px] text-[9px] italic leading-snug text-rose-500">
                                  Alasan: {item.rejection_reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Belum diatur</span>
                          )}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {statusBadge(item)}
                            {item?.approved_by && (
                              <span className="text-[9px] text-slate-400">
                                oleh {item.approved_by}{item.approved_at ? ` • ${new Date(item.approved_at).toLocaleDateString("id-ID")}` : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openModal(selectedBatch, s.level, s.label, item)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                            >
                              {item ? <Pencil size={12} /> : <Plus size={12} />}
                              {item ? "Edit" : "Atur"}
                            </button>
                            {item?.status === "menunggu" && canApprove && (
                              <>
                                <button
                                  onClick={() => handleApprove(selectedBatch, s.level, s.label)}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                                  title="Setujui"
                                >
                                  <ThumbsUp size={12} />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => openReject(selectedBatch, s.level, s.label)}
                                  className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-[10px] font-medium text-rose-700 transition hover:bg-rose-100"
                                  title="Tolak"
                                >
                                  <ThumbsDown size={12} />
                                  Tolak
                                </button>
                              </>
                            )}
                            {item && (
                              <button
                                onClick={() => handleDelete(selectedBatch, s.level, s.label)}
                                className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">
                {form.tanggal_mulai ? "Edit" : "Atur"} Jadwal - {form.batch_nama} {form.levelLabel}
              </h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
                <input type="text" value={form.batch_nama} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Tahapan</label>
                <input type="text" value={form.levelLabel} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal Mulai <span className="text-rose-500">*</span></label>
                <input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal Selesai <span className="text-rose-500">*</span></label>
                <input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button onClick={() => setShowModal(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleSave} disabled={submitting || !form.tanggal_mulai || !form.tanggal_selesai} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Tolak Jadwal - {rejectTarget.batch.nama_batch} {rejectTarget.label}
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Tulis alasan penolakan agar admin cabang bisa memperbaiki..."
                className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button onClick={() => setShowRejectModal(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleReject} disabled={rejecting} className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-50">
                {rejecting ? "Menyimpan..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
