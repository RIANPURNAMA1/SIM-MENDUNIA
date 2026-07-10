import { useState, useEffect } from "react";
import { Calendar, Plus, Pencil, Trash2, X } from "lucide-react";
import { jadwalLevelApi } from "../../services/api";
import type { BatchData, JadwalLevelItem } from "../../types";

const stages = [
  { level: -4, label: "Wawancara" },
  { level: -3, label: "Rapat Orang Tua" },
  { level: -2, label: "MCU" },
  { level: -1, label: "Pembukaan Kelas" },
  { level: 1, label: "Level 1" },
  { level: 2, label: "Level 2" },
  { level: 3, label: "Level 3" },
  { level: 4, label: "Level 4" },
];

export default function JadwalLevelPage() {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [jadwalMap, setJadwalMap] = useState<Record<string, JadwalLevelItem>>({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    batch_id: 0, batch_nama: "", level: 0, levelLabel: "",
    tanggal_mulai: "", tanggal_selesai: "",
  });

  const buildKey = (batchId: number, level: number) => `${batchId}-${level}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await jadwalLevelApi.list();
      setBatches(res.data.batches || []);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Jadwal Level</h1>
            <p className="text-sm text-slate-500">Atur tanggal mulai dan selesai setiap tahapan per batch</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">Memuat data...</div>
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Belum ada batch aktif</p>
          <p className="text-xs text-slate-400">Silakan tambah batch terlebih dahulu</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="border border-slate-200 px-3 py-2.5 font-semibold sticky left-0 bg-slate-50 z-10">Batch</th>
                  {stages.map((s) => (
                    <th key={s.level} className="border border-slate-200 px-3 py-2.5 text-center font-semibold whitespace-nowrap">{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2.5 font-semibold text-slate-800 sticky left-0 bg-white z-10">{batch.nama_batch}</td>
                    {stages.map((s) => {
                      const key = buildKey(batch.id, s.level);
                      const item = jadwalMap[key];
                      return (
                        <td key={s.level} className="border border-slate-200 px-3 py-2.5 text-center" style={{ minWidth: 180 }}>
                          {item ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="inline-flex rounded-md bg-emerald-100 px-3 py-1.5 text-[10px] font-medium text-emerald-700 whitespace-nowrap">
                                {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => openModal(batch, s.level, s.label, item)} className="rounded-md border border-slate-300 bg-white p-1 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600" title="Edit">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDelete(batch, s.level, s.label)} className="rounded-md border border-slate-300 bg-white p-1 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" title="Hapus">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => openModal(batch, s.level, s.label)} className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                              <Plus size={12} /> Atur Tanggal
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
