import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Search, RotateCcw, Plus, Upload, Bot, Timer,
  Trash2, Pencil, X, Sparkles, ChevronRight, LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";
import { siswaApi, adminCabangApi, APP_URL } from "../../services/api";
import type { Siswa } from "../../types";
import type { Pagination } from "../../types";

const AGAMA_OPTIONS = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"];
const LEVEL_OPTIONS = ["Proses", "Active", "Lulus", "Tidak Lulus", "Keluar"];
const LEVEL_BADGE: Record<string, string> = {
  Proses: "bg-[#feefc3] text-[#b06000]",
  Active: "bg-[#ceead6] text-[#137333]",
  Lulus: "bg-[#d2e3fc] text-[#1967d2]",
  "Tidak Lulus": "bg-[#f6d7d5] text-[#a50e0e]",
  Keluar: "bg-[#e8eaed] text-[#3c4043]",
};

export default function SiswaPage() {
  const isCabang = window.location.pathname.startsWith('/admin-cabang');
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<{ id: number; nama_kelas: string }[]>([]);
  const [batchList, setBatchList] = useState<{ id: number; nama_batch: string; warna: string | null }[]>([]);
  const [shifts, setShifts] = useState<{ id: number; nama_shift: string; jam_masuk: string; jam_pulang: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  const [editingLevel, setEditingLevel] = useState<{ siswaId: number; level: number } | null>(null);
  const [filterCabang, setFilterCabang] = useState("");
  const [cabangList, setCabangList] = useState<{ id: number; nama_cabang: string }[]>([]);
  const [filterBatch, setFilterBatch] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStatusKandidat, setFilterStatusKandidat] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [showModalTambah, setShowModalTambah] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
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
      if (filterCabang) params.cabang_id = filterCabang;
      if (filterBatch) params.batch_id = filterBatch;
      if (filterStatus) params.status = filterStatus;
      if (filterStatusKandidat) params.status_kandidat = filterStatusKandidat;
      if (filterSearch) params.search = filterSearch;
      params.page = page;
      params.per_page = 25;
      const res = isCabang ? await adminCabangApi.siswa(params) : await siswaApi.list(params);
      setData(res.data.data || []);
      setKelasList(res.data.kelas_list || []);
      setBatchList(res.data.batch_list || []);
      setCabangList(res.data.cabang_list || []);
      setShifts(res.data.shifts || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterCabang, filterBatch, filterStatus, filterStatusKandidat, filterSearch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setPage(1); }, [filterCabang, filterBatch, filterStatus, filterStatusKandidat, filterSearch]);

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
    setFilterCabang(""); setFilterBatch(""); setFilterStatus(""); setFilterStatusKandidat(""); setFilterSearch(""); setPage(1);
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
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Nama <span className="text-[#d93025]">*</span></label>
        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Shift</label>
        <select value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
          <option value="">- Pilih -</option>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0,5)}-{s.jam_pulang?.slice(0,5)})</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
        <select value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
          <option value="">- Pilih -</option>
          {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Level</label>
        <input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Jenis Kelamin</label>
        <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
          <option value="">- Pilih -</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tempat Lahir</label>
        <input type="text" value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tanggal Lahir</label>
        <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Agama</label>
        <select value={form.agama} onChange={(e) => setForm({ ...form, agama: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
          <option value="">- Pilih -</option>
          {AGAMA_OPTIONS.map((a) => <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">No. HP</label>
        <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Alamat</label>
        <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" rows={2} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Foto</label>
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0] || null })} className="w-full text-sm text-[#5f6368] file:mr-3 file:border-0 file:bg-[#f1f3f4] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#3c4043] hover:file:bg-[#e8eaed]" />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <Link to="/pendaftar" className="transition-colors hover:text-[#1a73e8]">
          Manage Kandidat
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Kelas Kandidat</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Kelas Kandidat</h1>
            <p className="text-sm text-[#5f6368]">Data kelas kandidat aktif</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowModalTambah(true)} className="inline-flex items-center gap-1.5 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]">
            <Plus size={16} /> Tambah
          </button>
          <button onClick={() => { setImportFileKelas(""); setImportFileBatch(""); setImportFileLevel(""); setImportFile(null); setShowModalImport(true); }} className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => { setImportAiKelas(""); setImportAiBatch(""); setImportAiLevel(""); setImportAiText(""); setShowModalImportAi(true); }} className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#e8f0fe] hover:text-[#1967d2]">
            <Bot size={16} /> Import AI
          </button>
          <button onClick={() => { setBulkShiftMode("all"); setBulkShiftValue(""); setShowModalBulkShift(true); }} className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#fef7e0] hover:text-[#b06000]">
            <Timer size={16} /> Atur Semua Shift
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4 ">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {!isCabang && (
          <select
            value={filterCabang}
            onChange={(e) => { setFilterCabang(e.target.value); setFilterBatch(''); setPage(1); }}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
          >
            <option value="">Semua Cabang</option>
            {cabangList.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nama_cabang}</option>
            ))}
          </select>
          )}

          <div className="relative">
            <button onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
              {filterBatch ? (() => {
                const b = batchList.find(x => String(x.id) === filterBatch)
                return <>
                  {b?.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                  <span className="truncate">{b?.nama_batch || filterBatch}</span>
                </>
              })() : <span className="text-[#5f6368]">Semua Batch</span>}
            </button>
            {showBatchDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)] max-h-48 overflow-y-auto min-w-[180px]">
                  <button onClick={() => { setFilterBatch(''); setShowBatchDropdown(false); setPage(1) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${!filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                    Semua Batch
                  </button>
                  {batchList.map(b => (
                    <button key={b.id} onClick={() => { setFilterBatch(String(b.id)); setShowBatchDropdown(false); setPage(1) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-[#f8f9fa] ${String(b.id) === filterBatch ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                      {b.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      {b.nama_batch}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="AKTIF">AKTIF</option>
            <option value="NONAKTIF">NONAKTIF</option>
          </select>
          <div className="flex items-center gap-1">
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Cari nama..." className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
            <button onClick={fetchData} className="inline-flex items-center justify-center bg-[#202124] px-3 py-2 text-sm text-white transition hover:bg-[#3c4043]">
              <Search size={16} />
            </button>
          </div>
          <button onClick={resetFilter} className="inline-flex items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex items-center gap-3 border border-[#dadce0] bg-[#f8f9fa] px-4 py-2 text-xs">
          <span className="font-semibold text-[#3c4043]">{selectedIds.length} siswa dipilih</span>
          <button onClick={() => { setBulkShiftMode("selected"); setBulkShiftValue(""); setShowModalBulkShift(true); }} className="bg-[#0E6187] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#084c63]">
            <Timer size={12} className="inline mr-1" /> Atur Shift
          </button>
          <button onClick={handleBulkDelete} className="border border-[#f28b82] bg-white px-3 py-1.5 text-xs font-medium text-[#c5221f] transition hover:bg-[#fce8e6]">
            <Trash2 size={12} className="inline mr-1" /> Hapus
          </button>
          <button onClick={() => { setSelectedIds([]); setSelectAll(false); }} className="border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6368] transition hover:bg-[#f1f3f4]">
            Batal
          </button>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] ">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-10 text-center">
                <input type="checkbox" checked={selectAll && data.length > 0} onChange={toggleSelectAll} className="border-[#dadce0] text-[#202124] focus:ring-[#9aa0a6]" />
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Siswa</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Batch</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Lv1</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Lv2</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Lv3</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Lv4</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Shift</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-6 py-12 text-center"><div className="h-3 w-full bg-[#e8eaed]/70" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]"><GraduationCap size={24} /></div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada data siswa</p>
                </td>
              </tr>
            ) : (
              data.map((s) => {
                const isKeluar = Object.values(s.level_status || {}).some(v => v === "Keluar");
                return (
                <tr key={s.id} className={`group ${isKeluar ? "bg-[#fce8e6]" : "bg-white"} transition hover:bg-[#f8f9fa]`}>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="border-[#dadce0] text-[#202124] focus:ring-[#9aa0a6]" />
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={fotoUrl(s)} alt={s.nama} className="h-7 w-7 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama)}&background=e5e7eb&color=6b7280&size=32`; }} />
                      <span className="font-semibold text-[#202124]">{s.nama}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{s.batch_relasi?.nama_batch || s.batch || "-"}</td>
                  {[1, 2, 3, 4].map((lv) => {
                    const st = s.level_status?.[`level_${lv}` as keyof typeof s.level_status] || "-";
                    const isEditing = editingLevel?.siswaId === s.id && editingLevel?.level === lv;
                    let badgeClass = "bg-[#f1f3f4] text-[#80868b]";
                    if (st === "Active") badgeClass = "bg-[#ceead6] text-[#137333]";
                    else if (st === "Lulus") badgeClass = "bg-[#d2e3fc] text-[#1967d2]";
                    else if (st === "Proses") badgeClass = "bg-[#feefc3] text-[#b06000]";
                    else if (st === "Tidak Lulus") badgeClass = "bg-[#f6d7d5] text-[#a50e0e]";
                    else if (st === "Keluar") badgeClass = "bg-[#e8eaed] text-[#3c4043]";
                    return (
                      <td key={lv} className="border border-[#dadce0] px-3 py-2.5 text-center relative">
                        {isEditing ? (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setEditingLevel(null)} />
                            <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 flex flex-col gap-0.5 border border-[#dadce0] bg-white p-1 shadow-[0_1px_3px_rgba(60,64,67,0.15)]">
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
                                className={`px-2.5 py-0.5 text-[9px] font-semibold text-left whitespace-nowrap ${LEVEL_BADGE[opt]} `}
                              >{opt}</button>
                            ))}
                          </div>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-0.5">
                            <span
                              onClick={() => setEditingLevel({ siswaId: s.id, level: lv })}
                              className={`inline-flex cursor-pointer px-2 py-0.5 text-[9px] font-semibold ${badgeClass} `}
                            >{st}</span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await siswaApi.autoLevelStatus(s.id, { level: lv });
                                  await fetchData();
                                } catch {}
                              }}
                              title="Hitung otomatis berdasarkan nilai"
                              className="p-0.5 text-[10px] text-[#80868b] opacity-0 transition hover:text-[#137333] group-hover:opacity-100"
                            ><Sparkles size={12} /></button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{s.shift?.nama_shift || "-"}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold ${s.status === "AKTIF" ? "bg-[#ceead6] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-[#80868b] transition hover:bg-[#fef7e0] hover:text-[#b06000]" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(s.id, s.nama)} className="p-1.5 text-[#80868b] transition hover:bg-[#fce8e6] hover:text-[#d93025]" title="Hapus"><Trash2 size={13} /></button>
                      <button onClick={() => handleToggleStatus(s.id, s.nama, s.status)} className="p-1.5 text-[#80868b] transition hover:bg-[#e8f0fe] hover:text-[#1a73e8]" title="Ubah Status"><RotateCcw size={13} /></button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6368]">
            Halaman {pagination.current_page} dari {pagination.last_page} &middot; {pagination.total} siswa
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage(page + 1)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah */}
      {showModalTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Tambah Siswa</h3>
              <button onClick={() => { setShowModalTambah(false); setForm(emptyForm); }} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleTambah}>
              <div className="px-4 py-4"><FormFields /></div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => { setShowModalTambah(false); setForm(emptyForm); }} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || !form.nama} className="bg-[#0E6187] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {showModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Edit Siswa</h3>
              <button onClick={() => { setShowModalEdit(false); setForm(emptyForm); setEditId(null); }} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="px-4 py-4"><FormFields /></div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => { setShowModalEdit(false); setForm(emptyForm); setEditId(null); }} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || !form.nama} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showModalImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-md bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Import Data Siswa</h3>
              <button onClick={() => setShowModalImport(false)} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleImportFile}>
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Kelas</label>
                    <select value={importFileKelas} onChange={(e) => setImportFileKelas(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
                      <option value="">- Pilih -</option>
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
                    <select value={importFileBatch} onChange={(e) => setImportFileBatch(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
                      <option value="">- Pilih -</option>
                      {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Level</label>
                    <input type="number" value={importFileLevel} onChange={(e) => setImportFileLevel(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">File (.txt / .csv) <span className="text-[#d93025]">*</span></label>
                  <input type="file" accept=".txt,.csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="w-full text-sm text-[#5f6368] file:mr-3 file:border-0 file:bg-[#f1f3f4] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#3c4043] hover:file:bg-[#e8eaed]" required />
                  <p className="mt-1 text-[10px] text-[#80868b]">Format: satu nama per baris</p>
                </div>
                <div className="bg-[#e8f0fe] px-3 py-2 text-[10px] text-[#1967d2]"><span className="font-semibold">Info:</span> Setiap nama akan otomatis dibuatkan akun login (password = nama siswa).</div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => setShowModalImport(false)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || !importFile} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">{submitting ? "Import..." : "Import"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import AI */}
      {showModalImportAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Import Data Siswa via AI</h3>
              <button onClick={() => setShowModalImportAi(false)} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleImportAi}>
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Kelas</label>
                    <select value={importAiKelas} onChange={(e) => setImportAiKelas(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
                      <option value="">- Pilih -</option>
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
                    <select value={importAiBatch} onChange={(e) => setImportAiBatch(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
                      <option value="">- Pilih -</option>
                      {batchList.map((b) => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Level</label>
                    <input type="number" value={importAiLevel} onChange={(e) => setImportAiLevel(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Paste Data Siswa <span className="text-[#d93025]">*</span></label>
                  <textarea value={importAiText} onChange={(e) => setImportAiText(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" rows={6} placeholder="Paste nama siswa di sini..." required />
                  <p className="mt-1 text-[10px] text-[#80868b]">AI akan mengekstrak nama-nama secara otomatis. Setiap nama akan dibuatkan akun login.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => setShowModalImportAi(false)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || !importAiText} className="bg-[#0E6187] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50">{submitting ? "Memproses..." : "Proses dengan AI"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Shift */}
      {showModalBulkShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Atur Shift Siswa</h3>
              <button onClick={() => setShowModalBulkShift(false)} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleBulkShift}>
              <div className="px-4 py-4 space-y-3">
                <p className="text-xs text-[#5f6368]">
                  {bulkShiftMode === "all" ? "Pilih shift untuk diterapkan ke SEMUA siswa." : `Pilih shift untuk ${selectedIds.length} siswa yang dipilih.`}
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Shift</label>
                  <select value={bulkShiftValue} onChange={(e) => setBulkShiftValue(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" required>
                    <option value="">- Pilih Shift -</option>
                    <option value="null" className="text-[#80868b]">Hapus Shift</option>
                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0,5)}-{s.jam_pulang?.slice(0,5)})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => setShowModalBulkShift(false)} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || !bulkShiftValue} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
