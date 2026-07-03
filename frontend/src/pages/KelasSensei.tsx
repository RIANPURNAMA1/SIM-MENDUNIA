import { useState, useEffect } from "react";
import { BookOpen, Search, RotateCcw, Plus, Trash2, X } from "lucide-react";
import { kelasSenseiApi, guruApi } from "../services/api";
import type { KelasSenseiData, Guru } from "../types";

const STATUS_STYLE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-blue-100 text-blue-700",
  dibatalkan: "bg-rose-100 text-rose-700",
};

export default function KelasSenseiPage() {
  const [data, setData] = useState<KelasSenseiData[]>([]);
  const [listSensei, setListSensei] = useState<{ id: number; name: string }[]>([]);
  const [listBatch, setListBatch] = useState<{ id: number; nama_batch: string }[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterSensei, setFilterSensei] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nama_kelas: "", level: "", user_id: "", batch_id: "",
    tanggal_mulai: "", tanggal_selesai: "", catatan: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (filterSensei) params.user_id = filterSensei;
      if (filterBatch) params.batch_id = filterBatch;
      if (filterStatus) params.status = filterStatus;
      const res = await kelasSenseiApi.list(params);
      setData(res.data.data || []);
      setListSensei(res.data.list_sensei || []);
      setListBatch(res.data.list_batch || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = async () => {
    setForm({ nama_kelas: "", level: "", user_id: "", batch_id: "", tanggal_mulai: "", tanggal_selesai: "", catatan: "" });
    try {
      const res = await guruApi.list();
      setGurus(res.data.data || []);
    } catch (_) {}
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!form.nama_kelas || !form.user_id || !form.tanggal_mulai || !form.tanggal_selesai) return;
    setSubmitting(true);
    try {
      await kelasSenseiApi.store({
        nama_kelas: form.nama_kelas,
        level: form.level,
        user_id: Number(form.user_id),
        batch_id: form.batch_id ? Number(form.batch_id) : null,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        catatan: form.catatan || null,
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus kelas "${nama}" secara permanen?`)) return;
    try {
      await kelasSenseiApi.destroy(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetFilter = () => {
    setStartDate(""); setEndDate(""); setFilterSensei(""); setFilterBatch(""); setFilterStatus("");
  };

  const applyFilter = () => fetchData();

  const statusBadge = (status: string) => (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[status] || "bg-slate-100 text-slate-500"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kelas Sensei</h1>
            <p className="text-sm text-slate-500">Daftar kelas yang dibuat oleh Sensei</p>
          </div>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
          <Plus size={16} /> Tambah Kelas
        </button>
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
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <button onClick={applyFilter} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700">
            <Search size={16} /> Filter
          </button>
          <button onClick={resetFilter} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1000px] border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold w-12">No</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Nama Kelas</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Batch</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Level</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Nama Sensei</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Tgl Mulai</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Tgl Selesai</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Total Pertemuan</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Absen Terisi</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Alpa</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Izin</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Status</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold w-16">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={13} className="border border-slate-200 px-3 py-3">
                    <div className="h-3 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={13} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <BookOpen size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data kelas sensei</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="border border-slate-200 px-3 py-2.5">
                    <span className="font-semibold text-slate-800">{item.nama_kelas}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5">
                    {item.batch_relasi ? (
                      <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700">{item.batch_relasi.nama_batch}</span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">{item.level || "-"}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-600">{item.user?.name || "-"}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{item.tanggal_mulai}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{item.tanggal_selesai}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-medium">{item.total_pertemuan}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-medium">{item.jumlah_absen}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-medium">{item.jumlah_alpa}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-medium">{item.jumlah_izin}</td>
                  <td className="border border-slate-200 px-3 py-2.5">{statusBadge(item.status)}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <button onClick={() => handleDelete(item.id, item.nama_kelas)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500" title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Tambah Kelas Sensei</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Kelas <span className="text-rose-500">*</span></label>
                <input type="text" value={form.nama_kelas} onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Kelas A1" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Level</label>
                <input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Beginner" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Sensei <span className="text-rose-500">*</span></label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Pilih Sensei</option>
                  {gurus.map((g) => (
                    <option key={g.id} value={g.user_id}>{g.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
                <select value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Pilih Batch</option>
                  {listBatch.map((b) => (
                    <option key={b.id} value={b.id}>{b.nama_batch}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal Mulai <span className="text-rose-500">*</span></label>
                  <input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal Selesai <span className="text-rose-500">*</span></label>
                  <input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Catatan</label>
                <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" rows={2} placeholder="Catatan (opsional)" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button onClick={() => setShowModal(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleAdd} disabled={submitting || !form.nama_kelas || !form.user_id || !form.tanggal_mulai || !form.tanggal_selesai} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
