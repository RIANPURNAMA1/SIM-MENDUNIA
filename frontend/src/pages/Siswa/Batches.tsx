import { useState, useEffect } from "react";
import { Layers, Plus, Pencil, Trash2, RotateCcw, X, Building2, Ban } from "lucide-react";
import { batchApi, cabangApi } from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";

interface BatchItem {
  id: number
  nama_batch: string
  status: string
  siswas_count: number
  kuota: number | null
  is_penuh: boolean
  is_penuh_manual: boolean
  cabang: { id: number; nama_cabang: string } | null
  created_at: string | null
  updated_at: string | null
}

interface CabangOption {
  id: number
  nama_cabang: string
}

interface ConfirmState {
  open: boolean
  title: string
  message: string
  variant: 'danger' | 'warning' | 'info'
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
}

export default function BatchesPage() {
  const [data, setData] = useState<BatchItem[]>([]);
  const [cabangList, setCabangList] = useState<CabangOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaBatch, setNamaBatch] = useState("");
  const [cabangId, setCabangId] = useState<number | "">("");
  const [kuota, setKuota] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, cabangRes] = await Promise.all([
        batchApi.list(),
        cabangApi.list(),
      ]);
      setData(batchRes.data.data || []);
      setCabangList(cabangRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditId(null);
    setNamaBatch("");
    setCabangId("");
    setKuota("");
    setShowModal(true);
  };

  const openEdit = (item: BatchItem) => {
    setEditId(item.id);
    setNamaBatch(item.nama_batch);
    setCabangId(item.cabang?.id ?? "");
    setKuota(item.kuota ? String(item.kuota) : "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBatch.trim()) return;
    setSubmitting(true);
    try {
      const payload = { nama_batch: namaBatch.trim(), cabang_id: cabangId || null, kuota: kuota ? Number(kuota) : null };
      if (editId) {
        await batchApi.update(editId, payload);
      } else {
        await batchApi.store(payload);
      }
      setShowModal(false);
      setNamaBatch("");
      setCabangId("");
      setKuota("");
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: BatchItem) => {
    if (item.siswas_count > 0) {
      setConfirm({
        open: true,
        title: 'Tidak Dapat Dihapus',
        message: `Batch "${item.nama_batch}" tidak bisa dihapus karena masih memiliki ${item.siswas_count} siswa.`,
        variant: 'danger',
        confirmLabel: 'Tutup',
        cancelLabel: '',
        onConfirm: () => setConfirm(null),
      })
      return
    }
    setConfirm({
      open: true,
      title: 'Hapus Batch',
      message: `Yakin ingin menghapus batch "${item.nama_batch}"?`,
      variant: 'danger',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await batchApi.destroy(item.id);
          fetchData();
        } catch (err) {
          console.error(err);
        }
      },
    })
  };

  const handleToggleStatus = (item: BatchItem) => {
    const newStatus = item.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    setConfirm({
      open: true,
      title: 'Ubah Status',
      message: `Ubah status batch "${item.nama_batch}" menjadi ${newStatus}?`,
      variant: 'warning',
      confirmLabel: 'Ya, Ubah',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await batchApi.toggleStatus(item.id);
          fetchData();
        } catch (err) {
          console.error(err);
        }
      },
    })
  };

  const handleTogglePenuh = (item: BatchItem) => {
    const label = item.is_penuh_manual ? 'Tidak Penuh' : 'Penuh';
    setConfirm({
      open: true,
      title: 'Tandai Batch',
      message: `Tandai batch "${item.nama_batch}" sebagai ${label}?`,
      variant: 'warning',
      confirmLabel: `Ya, ${label}`,
      cancelLabel: 'Batal',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await batchApi.togglePenuh(item.id);
          fetchData();
        } catch (err) {
          console.error(err);
        }
      },
    })
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
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
        <table className="w-full min-w-[600px] border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 text-center w-12 font-semibold">No</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Nama Batch</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Cabang</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Status</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Kuota</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="border border-slate-200 px-3 py-3"><div className="h-3 w-full rounded bg-slate-200/70" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Layers size={24} /></div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data batch</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="border border-slate-200 px-3 py-2.5 font-semibold text-slate-800">{item.nama_batch}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-600">
                    {item.cabang ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" />
                        {item.cabang.nama_cabang}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    {item.kuota ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${item.is_penuh ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                        {item.siswas_count}/{item.kuota}
                        {item.is_penuh && <span className="font-semibold">Penuh</span>}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700">
                        {item.siswas_count} siswa
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500" title="Hapus"><Trash2 size={13} /></button>
                      <button onClick={() => handleToggleStatus(item)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500" title="Aktif/Nonaktif"><RotateCcw size={13} /></button>
                      <button onClick={() => handleTogglePenuh(item)} className={`rounded-md p-1.5 transition ${item.is_penuh_manual ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-slate-400 hover:bg-orange-50 hover:text-orange-500'}`} title={item.is_penuh_manual ? 'Tandai Tidak Penuh' : 'Tandai Penuh'}><Ban size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmModal
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          confirmLabel={confirm.confirmLabel}
          cancelLabel={confirm.cancelLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">{editId ? "Edit Batch" : "Tambah Batch"}</h3>
              <button onClick={() => { setShowModal(false); setNamaBatch(""); setCabangId(""); setKuota(""); setEditId(null); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-4 py-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Batch <span className="text-rose-500">*</span></label>
                  <input type="text" value={namaBatch} onChange={(e) => setNamaBatch(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Batch 14" required autoFocus />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Cabang</label>
                  <select value={cabangId} onChange={(e) => setCabangId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="">Pilih Cabang</option>
                    {cabangList.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Kuota Siswa <span className="font-normal text-slate-400">(kosongi jika tidak terbatas)</span></label>
                  <input type="number" min="1" value={kuota} onChange={(e) => setKuota(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Contoh: 50" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => { setShowModal(false); setNamaBatch(""); setCabangId(""); setKuota(""); setEditId(null); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
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
