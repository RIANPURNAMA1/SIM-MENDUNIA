import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Plus, Pencil, Trash2, X, ChevronLeft, Building2, Layers, Check, ThumbsUp, ThumbsDown, ChevronRight, LayoutDashboard } from "lucide-react";
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
      return <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2.5 py-1 text-[10px] font-medium text-[#5f6368]">Belum diatur</span>;
    }
    if (item.status === "menunggu") {
      return (
        <span className="inline-flex items-center gap-1 bg-[#feefc3] px-2.5 py-1 text-[10px] font-medium text-[#b06000]">
          <span className="h-1.5 w-1.5 animate-pulse bg-[#e37400]" />
          Menunggu Approval
        </span>
      );
    }
    if (item.status === "disetujui") {
      return (
        <span className="inline-flex items-center gap-1 border border-[#a8dab5] bg-[#e6f4ea] px-2.5 py-1 text-[10px] font-medium text-[#137333]">
          <Check size={10} />
          Disetujui
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 border border-[#f6aea9] bg-[#fce8e6] px-2.5 py-1 text-[10px] font-medium text-[#a50e0e]">
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
        <div className="border border-[#dadce0] p-8 text-center text-sm text-[#80868b]">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Jadwal Level</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Jadwal Level</h1>
            <p className="text-sm text-[#5f6368]">Atur tanggal mulai dan selesai setiap tahapan per batch, lalu diverifikasi oleh Manager / HR</p>
          </div>
        </div>
      </div>

      {/* Banner pengajuan untuk approver */}
      {canApprove && totalPending > 0 && (
        <div className="mb-4 flex items-start gap-3 border border-[#f6aea9] bg-[#fce8e6] px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#d93025] text-white">
            <ThumbsUp size={14} />
          </div>
          <div className="text-xs text-[#8a0e0b]">
            <p className="font-semibold">
              {totalPending} pengajuan jadwal menunggu persetujuan
            </p>
            <p className="mt-0.5 text-[#c5221f]">
              Buka cabang dan batch yang ditandai merah untuk melihat detail lalu menyetujui atau menolak.
            </p>
          </div>
        </div>
      )}

      {/* View: Cabang Cards */}
      {!selectedCabang && !selectedBatch && (
        <>
          {cabangs.length === 0 && !hasUnassigned ? (
            <div className="border border-[#dadce0] p-8 text-center">
              <Calendar size={32} className="mx-auto mb-2 text-[#9aa0a6]" />
              <p className="text-sm font-medium text-[#5f6368]">Belum ada batch aktif</p>
              <p className="text-xs text-[#80868b]">Silakan tambah batch terlebih dahulu</p>
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
                      className={`group border bg-white p-4 text-left transition hover: ${pending > 0 ? "border-[#f28b82] ring-1 ring-[#f6d7d5] hover:border-[#ee675c]" : "border-[#dadce0] hover:border-[#8ab4f8]"}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe] text-[#1a73e8] group-hover:bg-[#d2e3fc]">
                          <Building2 size={20} />
                        </div>
                        {pending > 0 && (
                          <span className="inline-flex items-center gap-1 bg-[#d93025] px-2 py-0.5 text-[10px] font-bold text-white">
                            {pending} pengajuan
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#202124]">{cabang.nama_cabang}</h3>
                      <p className="mt-1 text-xs text-[#80868b]">{batchesByCabang(cabang.id).length} batch</p>
                    </button>
                  );
                })}
              {hasUnassigned && (() => {
                const pending = pendingSum(cabangTanpaCabang);
                return (
                  <button
                    onClick={() => setSelectedCabang({ id: 0, nama_cabang: "Tanpa Cabang" })}
                    className={`group border border-dashed bg-white p-4 text-left transition hover: ${pending > 0 ? "border-[#f28b82] ring-1 ring-[#f6d7d5] hover:border-[#ee675c]" : "border-[#dadce0] hover:border-[#bdc1c6]"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center bg-[#f8f9fa] text-[#5f6368] group-hover:bg-[#f1f3f4]">
                        <Building2 size={20} />
                      </div>
                      {pending > 0 && (
                        <span className="inline-flex items-center gap-1 bg-[#d93025] px-2 py-0.5 text-[10px] font-bold text-white">
                          {pending} pengajuan
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-[#5f6368]">Tanpa Cabang</h3>
                    <p className="mt-1 text-xs text-[#80868b]">{cabangTanpaCabang.length} batch</p>
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
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-[#5f6368] transition hover:text-[#202124]"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
          <h2 className="mb-3 text-base font-semibold text-[#202124]">{selectedCabang.nama_cabang}</h2>
          {(() => {
            const list = selectedCabang.id === 0 ? cabangTanpaCabang : batchesByCabang(selectedCabang.id);
            if (list.length === 0) {
              return (
                <div className="border border-[#dadce0] p-8 text-center text-sm text-[#80868b]">
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
                        className={`group border bg-white p-4 text-left transition hover: ${pending > 0 ? "border-[#f28b82] ring-1 ring-[#f6d7d5] hover:border-[#ee675c]" : "border-[#dadce0] hover:border-[#a8dab5]"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center bg-[#e6f4ea] text-[#137333] group-hover:bg-[#084c63]">
                            <Layers size={20} />
                          </div>
                          {pending > 0 && (
                            <span className="inline-flex items-center gap-1 bg-[#d93025] px-2 py-0.5 text-[10px] font-bold text-white">
                              {pending} pengajuan
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#202124]">{batch.nama_batch}</h3>
                        <p className="mt-1 text-xs text-[#80868b]">{selectedCabang.nama_cabang}</p>
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
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-[#5f6368] transition hover:text-[#202124]"
          >
            <ChevronLeft size={14} /> Kembali
          </button>
          <h2 className="mb-3 text-base font-semibold text-[#202124]">{selectedBatch.nama_batch}</h2>
          <div className="border border-[#dadce0] ">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-xs text-[#3c4043]">
                <thead className="text-[10px] text-[#5f6368] ">
                  <tr>
                    <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Tahapan</th>
                    <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Tanggal</th>
                    <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Status</th>
                    <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((s) => {
                    const key = buildKey(selectedBatch.id, s.level);
                    const item = jadwalMap[key];
                    return (
                      <tr key={s.level} className="bg-white transition hover:bg-[#f8f9fa]">
                        <td className="border-b border-[#e8eaed] px-3 py-2.5 font-semibold text-[#3c4043]">{s.label}</td>
                        <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                          {item ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex bg-[#0E6187] px-3 py-1.5 text-[10px] font-medium text-white whitespace-nowrap">
                                {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                              </span>
                              {item.status === "ditolak" && item.rejection_reason && (
                                <span className="max-w-[220px] text-[9px] italic leading-snug text-[#d93025]">
                                  Alasan: {item.rejection_reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#80868b]">Belum diatur</span>
                          )}
                        </td>
                        <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {statusBadge(item)}
                            {item?.approved_by && (
                              <span className="text-[9px] text-[#80868b]">
                                oleh {item.approved_by}{item.approved_at ? ` • ${new Date(item.approved_at).toLocaleDateString("id-ID")}` : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openModal(selectedBatch, s.level, s.label, item)}
                              className="inline-flex items-center gap-1 border border-[#dadce0] bg-white px-3 py-1.5 text-[10px] font-medium text-[#5f6368] transition hover:border-[#8ab4f8] hover:text-[#1a73e8]"
                            >
                              {item ? <Pencil size={12} /> : <Plus size={12} />}
                              {item ? "Edit" : "Atur"}
                            </button>
                            {item?.status === "menunggu" && canApprove && (
                              <>
                                <button
                                  onClick={() => handleApprove(selectedBatch, s.level, s.label)}
                                  className="inline-flex items-center gap-1 border border-[#a8dab5] bg-[#e6f4ea] px-2.5 py-1.5 text-[10px] font-medium text-[#137333] transition hover:bg-[#084c63]"
                                  title="Setujui"
                                >
                                  <ThumbsUp size={12} />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => openReject(selectedBatch, s.level, s.label)}
                                  className="inline-flex items-center gap-1 border border-[#f28b82] bg-[#fce8e6] px-2.5 py-1.5 text-[10px] font-medium text-[#a50e0e] transition hover:bg-[#f6d7d5]"
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
                                className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#fce8e6] hover:text-[#c5221f]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">
                {form.tanggal_mulai ? "Edit" : "Atur"} Jadwal - {form.batch_nama} {form.levelLabel}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
                <input type="text" value={form.batch_nama} readOnly className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#3c4043] outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tahapan</label>
                <input type="text" value={form.levelLabel} readOnly className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#3c4043] outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tanggal Mulai <span className="text-[#d93025]">*</span></label>
                <input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tanggal Selesai <span className="text-[#d93025]">*</span></label>
                <input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button onClick={() => setShowModal(false)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
              <button onClick={handleSave} disabled={submitting || !form.tanggal_mulai || !form.tanggal_selesai} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">
                Tolak Jadwal - {rejectTarget.batch.nama_batch} {rejectTarget.label}
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">
              <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Tulis alasan penolakan agar admin cabang bisa memperbaiki..."
                className="w-full resize-none border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#ee675c] focus:border-[#1a73e8] focus:ring-[#ee675c]"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button onClick={() => setShowRejectModal(false)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
              <button onClick={handleReject} disabled={rejecting} className="bg-[#c5221f] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#a50e0e] disabled:opacity-50">
                {rejecting ? "Menyimpan..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
