import { useState, useEffect } from "react";
import { Layers, Plus, Pencil, Trash2, RotateCcw, X } from "lucide-react";
import { batchApi } from "../services/api";

interface BatchItem {
  id: number
  nama_batch: string
  status: string
  siswas_count: number
  created_at: string | null
  updated_at: string | null
}

export default function BatchesPage() {
  const [data, setData] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaBatch, setNamaBatch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await batchApi.list();
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditId(null); setNamaBatch(""); setShowModal(true); };

  const openEdit = (item: BatchItem) => { setEditId(item.id); setNamaBatch(item.nama_batch); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBatch.trim()) return;
    setSubmitting(true);
    try {
      if (editId) {
        await batchApi.update(editId, { nama_batch: namaBatch.trim() });
      } else {
        await batchApi.store({ nama_batch: namaBatch.trim() });
      }
      setShowModal(false);
      setNamaBatch("");
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: BatchItem) => {
    if (item.siswas_count > 0) {
      alert(`Batch "${item.nama_batch}" tidak bisa dihapus karena masih memiliki ${item.siswas_count} siswa`);
      return;
    }
    if (!confirm(`Hapus batch "${item.nama_batch}"?`)) return;
    try {
      await batchApi.destroy(item.id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (item: BatchItem) => {
    const newStatus = item.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    if (!confirm(`Ubah status "${item.nama_batch}" menjadi ${newStatus}?`)) return;
    try {
      await batchApi.toggleStatus(item.id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Batch</h1>
            <p className="text-sm text-slate-500">Kelola data batch siswa</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
          <Plus size={16} /> Tambah Batch
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[500px] border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 text-center w-12 font-semibold">No</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Nama Batch</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Status</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Jumlah Siswa</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="border border-slate-200 px-3 py-3"><div className="h-3 w-full rounded bg-slate-200/70" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Layers size={24} /></div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data batch</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="border border-slate-200 px-3 py-2.5 font-semibold text-slate-800">{item.nama_batch}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700">{item.siswas_count} siswa</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500" title="Hapus"><Trash2 size={13} /></button>
                      <button onClick={() => handleToggleStatus(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500" title="Ubah Status"><RotateCcw size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">{editId ? "Edit Batch" : "Tambah Batch"}</h3>
              <button onClick={() => { setShowModal(false); setNamaBatch(""); setEditId(null); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-4 py-4">
                <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Batch <span className="text-rose-500">*</span></label>
                <input type="text" value={namaBatch} onChange={(e) => setNamaBatch(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Batch 14" required autoFocus />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => { setShowModal(false); setNamaBatch(""); setEditId(null); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !namaBatch.trim()} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
