import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Search, RotateCcw, Plus, Upload, Bot, Timer,
  Trash2, Pencil, Check, X,
} from "lucide-react";
import { siswaApi, adminCabangApi, APP_URL } from "../../services/api";
import type { Siswa } from "../../types";

const AGAMA_OPTIONS = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"];
const LEVEL_OPTIONS = ["Proses", "Active", "Lulus", "Tidak Lulus", "Keluar"];
const LEVEL_BADGE: Record<string, string> = {
  Proses: "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
  Lulus: "bg-blue-100 text-blue-700",
  "Tidak Lulus": "bg-red-100 text-red-700",
  Keluar: "bg-gray-200 text-gray-700",
};

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<{ id: number; nama_kelas: string }[]>([]);
  const [batchList, setBatchList] = useState<{ id: number; nama_batch: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: number; nama_shift: string; jam_masuk: string; jam_pulang: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingLevel, setEditingLevel] = useState<{ siswaId: number; level: number } | null>(null);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [showModalTambah, setShowModalTambah] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalAkun, setShowModalAkun] = useState(false);
  const [showModalImport, setShowModalImport] = useState(false);
  const [showModalImportAi, setShowModalImportAi] = useState(false);
  const [showModalBulkShift, setShowModalBulkShift] = useState(false);
  const [bulkShiftMode, setBulkShiftMode] = useState<"all" | "selected">("selected");
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    nama: "", kelas_id: "", shift_id: "", batch_id: "", level: "",
    jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "", agama: "",
    alamat: "", no_hp: "", foto: null as File | null,
  };
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const [akunForm, setAkunForm] = useState({ siswa_id: 0, nama: "", email: "", password: "siswa123" });

  const [importAiText, setImportAiText] = useState("");
  const [importAiBatch, setImportAiBatch] = useState("");
  const [importAiLevel, setImportAiLevel] = useState("");
  const [importAiKelas, setImportAiKelas] = useState("");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileBatch, setImportFileBatch] = useState("");
  const [importFileLevel, setImportFileLevel] = useState("");
  const [importFileKelas, setImportFileKelas] = useState("");

  const [bulkShiftValue, setBulkShiftValue] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (filterBatch) params.batch_id = filterBatch;
      if (filterStatus) params.status = filterStatus;
      if (filterSearch) params.search = filterSearch;
      const isCabang = window.location.pathname.startsWith('/admin-cabang');
      const res = isCabang ? await adminCabangApi.siswa(params) : await siswaApi.list(params);
      setData(res.data.data || []);
      setKelasList(res.data.kelas_list || []);
      setBatchList(res.data.batch_list || []);
      setShifts(res.data.shifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterBatch, filterStatus, filterSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev]);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((d) => d.id));
    }
    setSelectAll(!selectAll);
  };

  const resetFilter = () => {
    setFilterBatch(""); setFilterStatus(""); setFilterSearch("");
  };

  const fotoUrl = (s: Siswa) => {
    if (s.foto) return `${APP_URL}/uploads/siswa/${s.foto}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama)}&background=e5e7eb&color=6b7280&size=32`;
  };

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== "") fd.append(k, v as string | Blob);
      });
      await siswaApi.store(fd);
      setShowModalTambah(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: Siswa) => {
    setEditId(s.id);
    setForm({
      nama: s.nama, kelas_id: String(s.kelas_id || ""), shift_id: String(s.shift_id || ""),
      batch_id: String(s.batch_id || ""), level: String(s.level || ""),
      jenis_kelamin: s.jenis_kelamin || "", tempat_lahir: s.tempat_lahir || "",
      tanggal_lahir: s.tanggal_lahir || "", agama: s.agama || "",
      alamat: s.alamat || "", no_hp: s.no_hp || "", foto: null,
    });
    setShowModalEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !form.nama) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== "") fd.append(k, v as string | Blob);
      });
      await siswaApi.update(editId, fd);
      setShowModalEdit(false);
      setForm(emptyForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus data siswa "${nama}" secara permanen?`)) return;
    try {
      await siswaApi.destroy(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: number, nama: string, status: string) => {
    const newStatus = status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    if (!confirm(`Ubah status ${nama} menjadi ${newStatus}?`)) return;
    try {
      await siswaApi.toggleStatus(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuatAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!akunForm.email || !akunForm.password) return;
    setSubmitting(true);
    try {
      await siswaApi.buatkanAkun(akunForm.siswa_id, { email: akunForm.email, password: akunForm.password });
      setShowModalAkun(false);
      setAkunForm({ siswa_id: 0, nama: "", email: "", password: "siswa123" });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} data siswa secara permanen?`)) return;
    try {
      await siswaApi.bulkDelete(selectedIds);
      setSelectedIds([]);
      setSelectAll(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkShiftValue) return;
    setSubmitting(true);
    try {
      await siswaApi.bulkUpdateShift({
        shift_id: bulkShiftValue,
        mode: bulkShiftMode,
        ids: bulkShiftMode === "selected" ? selectedIds : undefined,
      });
      setShowModalBulkShift(false);
      setBulkShiftValue("");
      if (bulkShiftMode === "selected") { setSelectedIds([]); setSelectAll(false); }
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      if (importFileKelas) fd.append("kelas_id", importFileKelas);
      if (importFileBatch) fd.append("batch_id", importFileBatch);
      if (importFileLevel) fd.append("level", importFileLevel);
      await siswaApi.import(fd);
      setShowModalImport(false);
      setImportFile(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importAiText) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("text", importAiText);
      if (importAiKelas) fd.append("kelas_id", importAiKelas);
      if (importAiBatch) fd.append("batch_id", importAiBatch);
      if (importAiLevel) fd.append("level", importAiLevel);
      await siswaApi.importAi(fd);
      setShowModalImportAi(false);
      setImportAiText("");
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const FormFields = ({ prefix = "" }) => (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Nama <span className="text-rose-500">*</span></label>
        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Shift</label>
        <select value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <option value="">- Pilih -</option>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0,5)}-{s.jam_pulang?.slice(0,5)})</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
        <select value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <option value="">- Pilih -</option>
          {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Level</label>
        <input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Jenis Kelamin</label>
        <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <option value="">- Pilih -</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Tempat Lahir</label>
        <input type="text" value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal Lahir</label>
        <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Agama</label>
        <select value={form.agama} onChange={(e) => setForm({ ...form, agama: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <option value="">- Pilih -</option>
          {AGAMA_OPTIONS.map((a) => <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">No. HP</label>
        <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Alamat</label>
        <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" rows={2} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Foto</label>
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0] || null })} className="w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kelas Kandidat</h1>
            <p className="text-sm text-slate-500">Data kelas kandidat aktif</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowModalTambah(true)} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700">
            <Plus size={16} /> Tambah
          </button>
          <button onClick={() => { setImportFileKelas(""); setImportFileBatch(""); setImportFileLevel(""); setImportFile(null); setShowModalImport(true); }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => { setImportAiKelas(""); setImportAiBatch(""); setImportAiLevel(""); setImportAiText(""); setShowModalImportAi(true); }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-sky-50 hover:text-sky-700">
            <Bot size={16} /> Import AI
          </button>
          <button onClick={() => { setBulkShiftMode("all"); setBulkShiftValue(""); setShowModalBulkShift(true); }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-amber-50 hover:text-amber-700">
            <Timer size={16} /> Atur Semua Shift
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Batch</option>
            {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="AKTIF">AKTIF</option>
            <option value="NONAKTIF">NONAKTIF</option>
          </select>
          <div className="flex items-center gap-1">
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Cari nama..." className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <button onClick={fetchData} className="inline-flex items-center justify-center rounded-md bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700">
              <Search size={16} />
            </button>
          </div>
          <button onClick={resetFilter} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <span className="font-semibold text-slate-700">{selectedIds.length} siswa dipilih</span>
          <button onClick={() => { setBulkShiftMode("selected"); setBulkShiftValue(""); setShowModalBulkShift(true); }} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700">
            <Timer size={12} className="inline mr-1" /> Atur Shift
          </button>
          <button onClick={handleBulkDelete} className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
            <Trash2 size={12} className="inline mr-1" /> Hapus
          </button>
          <button onClick={() => { setSelectedIds([]); setSelectAll(false); }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
            Batal
          </button>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 text-center w-10">
                <input type="checkbox" checked={selectAll && data.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Siswa</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Batch</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Lv1</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Lv2</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Lv3</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Lv4</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Shift</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">L/P</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">No. HP</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Status</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold">Akun</th>
              <th className="border border-slate-200 px-3 py-2.5 text-center font-semibold w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={13} className="border border-slate-200 px-3 py-3"><div className="h-3 w-full rounded bg-slate-200/70" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={13} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><GraduationCap size={24} /></div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data siswa</p>
                </td>
              </tr>
            ) : (
              data.map((s) => {
                const isKeluar = Object.values(s.level_status || {}).some(v => v === "Keluar");
                return (
                <tr key={s.id} className={`${isKeluar ? "bg-red-50" : "bg-white"} transition hover:bg-slate-50`}>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={fotoUrl(s)} alt={s.nama} className="h-7 w-7 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama)}&background=e5e7eb&color=6b7280&size=32`; }} />
                      <span className="font-semibold text-slate-800">{s.nama}</span>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{s.batch_relasi?.nama_batch || s.batch || "-"}</td>
                  {[1, 2, 3, 4].map((lv) => {
                    const st = s.level_status?.[`level_${lv}` as keyof typeof s.level_status] || "-";
                    const isEditing = editingLevel?.siswaId === s.id && editingLevel?.level === lv;
                    let badgeClass = "bg-slate-100 text-slate-400";
                    if (st === "Active") badgeClass = "bg-emerald-100 text-emerald-700";
                    else if (st === "Lulus") badgeClass = "bg-blue-100 text-blue-700";
                    else if (st === "Proses") badgeClass = "bg-amber-100 text-amber-700";
                    else if (st === "Tidak Lulus") badgeClass = "bg-red-100 text-red-700";
                    else if (st === "Keluar") badgeClass = "bg-gray-200 text-gray-700";
                    return (
                      <td key={lv} className="border border-slate-200 px-3 py-2.5 text-center relative">
                        {isEditing ? (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setEditingLevel(null)} />
                            <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 flex flex-col gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                            {LEVEL_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                onClick={async () => {
                                  setEditingLevel(null);
                                  try {
                                    await siswaApi.updateLevelStatus(s.id, { level: lv, status: opt });
                                    await fetchData();
                                  } catch { }
                                }}
                                className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold text-left whitespace-nowrap ${LEVEL_BADGE[opt]} hover:ring-2 hover:ring-slate-400`}
                              >{opt}</button>
                            ))}
                          </div>
                          </>
                        ) : (
                          <span
                            onClick={() => setEditingLevel({ siswaId: s.id, level: lv })}
                            className={`inline-flex cursor-pointer rounded-full px-2 py-0.5 text-[9px] font-semibold ${badgeClass} hover:ring-2 hover:ring-slate-300`}
                          >{st}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{s.shift?.nama_shift || "-"}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <span className={`font-semibold ${s.jenis_kelamin === "L" ? "text-blue-600" : s.jenis_kelamin === "P" ? "text-rose-600" : "text-slate-300"}`}>
                      {s.jenis_kelamin || "-"}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{s.no_hp || "-"}</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${s.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    {s.user_id ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700"><Check size={10} /> Ada</span>
                    ) : (
                      <button onClick={() => setAkunForm({ siswa_id: s.id, nama: s.nama, email: "", password: "siswa123" }) || setShowModalAkun(true)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[9px] font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">
                        <X size={10} className="inline mr-0.5" /> Buat Akun
                      </button>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(s.id, s.nama)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500" title="Hapus"><Trash2 size={13} /></button>
                      <button onClick={() => handleToggleStatus(s.id, s.nama, s.status)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500" title="Ubah Status"><RotateCcw size={13} /></button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah */}
      {showModalTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Tambah Siswa</h3>
              <button onClick={() => { setShowModalTambah(false); setForm(emptyForm); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleTambah}>
              <div className="px-4 py-4"><FormFields /></div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => { setShowModalTambah(false); setForm(emptyForm); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !form.nama} className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {showModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Edit Siswa</h3>
              <button onClick={() => { setShowModalEdit(false); setForm(emptyForm); setEditId(null); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="px-4 py-4"><FormFields /></div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => { setShowModalEdit(false); setForm(emptyForm); setEditId(null); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !form.nama} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Akun */}
      {showModalAkun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Buat Akun Login untuk {akunForm.nama}</h3>
              <button onClick={() => { setShowModalAkun(false); setAkunForm({ siswa_id: 0, nama: "", email: "", password: "siswa123" }); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleBuatAkun}>
              <div className="px-4 py-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Email <span className="text-rose-500">*</span></label>
                  <input type="email" value={akunForm.email} onChange={(e) => setAkunForm({ ...akunForm, email: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Password <span className="text-rose-500">*</span></label>
                  <input type="text" value={akunForm.password} onChange={(e) => setAkunForm({ ...akunForm, password: e.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                  <p className="mt-1 text-[10px] text-slate-400">Default: siswa123</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => { setShowModalAkun(false); setAkunForm({ siswa_id: 0, nama: "", email: "", password: "siswa123" }); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !akunForm.email} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">{submitting ? "Menyimpan..." : "Buat Akun"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showModalImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Import Data Siswa</h3>
              <button onClick={() => setShowModalImport(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleImportFile}>
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Kelas</label>
                    <select value={importFileKelas} onChange={(e) => setImportFileKelas(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">- Pilih -</option>
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
                    <select value={importFileBatch} onChange={(e) => setImportFileBatch(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">- Pilih -</option>
                      {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Level</label>
                    <input type="number" value={importFileLevel} onChange={(e) => setImportFileLevel(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">File (.txt / .csv) <span className="text-rose-500">*</span></label>
                  <input type="file" accept=".txt,.csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200" required />
                  <p className="mt-1 text-[10px] text-slate-400">Format: satu nama per baris</p>
                </div>
                <div className="rounded-md bg-sky-50 px-3 py-2 text-[10px] text-sky-700"><span className="font-semibold">Info:</span> Setiap nama akan otomatis dibuatkan akun login (password = nama siswa).</div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => setShowModalImport(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !importFile} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">{submitting ? "Import..." : "Import"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import AI */}
      {showModalImportAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Import Data Siswa via AI</h3>
              <button onClick={() => setShowModalImportAi(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleImportAi}>
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Kelas</label>
                    <select value={importAiKelas} onChange={(e) => setImportAiKelas(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">- Pilih -</option>
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Batch</label>
                    <select value={importAiBatch} onChange={(e) => setImportAiBatch(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">- Pilih -</option>
                      {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Level</label>
                    <input type="number" value={importAiLevel} onChange={(e) => setImportAiLevel(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Paste Data Siswa <span className="text-rose-500">*</span></label>
                  <textarea value={importAiText} onChange={(e) => setImportAiText(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" rows={6} placeholder="Paste nama siswa di sini..." required />
                  <p className="mt-1 text-[10px] text-slate-400">AI akan mengekstrak nama-nama secara otomatis. Setiap nama akan dibuatkan akun login.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => setShowModalImportAi(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !importAiText} className="rounded-md bg-sky-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-sky-700 disabled:opacity-50">{submitting ? "Memproses..." : "Proses dengan AI"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Shift */}
      {showModalBulkShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Atur Shift Siswa</h3>
              <button onClick={() => setShowModalBulkShift(false)} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleBulkShift}>
              <div className="px-4 py-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {bulkShiftMode === "all" ? "Pilih shift untuk diterapkan ke SEMUA siswa." : `Pilih shift untuk ${selectedIds.length} siswa yang dipilih.`}
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Shift</label>
                  <select value={bulkShiftValue} onChange={(e) => setBulkShiftValue(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required>
                    <option value="">- Pilih Shift -</option>
                    <option value="null" className="text-slate-400">Hapus Shift</option>
                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0,5)}-{s.jam_pulang?.slice(0,5)})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => setShowModalBulkShift(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={submitting || !bulkShiftValue} className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
