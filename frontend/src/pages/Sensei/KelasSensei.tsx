import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Search, RotateCcw, Plus, Trash2, X, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { kelasSenseiApi, guruApi, jadwalLevelApi, adminCabangApi } from "../../services/api";
import type { KelasSenseiData, Guru } from "../../types";

function formatDate(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const STATUS_STYLE: Record<string, string> = {
  aktif: "bg-[#ceead6] text-[#137333]",
  proses: "bg-[#fef7e0] text-[#b06000]",
  selesai: "bg-[#e8f0fe] text-[#1967d2]",
  dibatalkan: "bg-[#f6d7d5] text-[#a50e0e]",
};

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  proses: "Proses Pembelajaran",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export default function KelasSenseiPage() {
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const [data, setData] = useState<KelasSenseiData[]>([]);
  const [listSensei, setListSensei] = useState<{ id: number; name: string }[]>([]);
  const [listBatch, setListBatch] = useState<{ id: number; nama_batch: string; warna?: string | null; cabang?: { id: number; nama_cabang: string } | null }[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [jadwalLevels, setJadwalLevels] = useState<Record<string, { tanggal_mulai: string; tanggal_selesai: string }>>({});
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterSensei, setFilterSensei] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      const res = isAdminCabang ? await adminCabangApi.kelasSensei(params) : await kelasSenseiApi.list(params);
      setData(res.data.data || []);
      setListSensei(res.data.list_sensei || []);
      setListBatch(res.data.list_batch || res.data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const jadwalPromise = isAdminCabang ? adminCabangApi.jadwalLevel() : jadwalLevelApi.list();
    jadwalPromise.then(res => setJadwalLevels(res.data.jadwal || {})).catch(() => {});
  }, []);

  const openAddModal = async () => {
    setEditingId(null);
    setForm({ nama_kelas: "", level: "", user_id: "", batch_id: "", tanggal_mulai: "", tanggal_selesai: "", catatan: "" });
    try {
      const res = isAdminCabang ? await adminCabangApi.guru() : await guruApi.list();
      setGurus(res.data.data || []);
    } catch (_) {}
    setShowModal(true);
  };

  const openEditModal = async (item: KelasSenseiData) => {
    setEditingId(item.id);
    setForm({
      nama_kelas: item.nama_kelas || "",
      level: item.level || "",
      user_id: item.user_id ? String(item.user_id) : "",
      batch_id: item.batch_id ? String(item.batch_id) : "",
      tanggal_mulai: item.tanggal_mulai ? String(item.tanggal_mulai).slice(0, 10) : "",
      tanggal_selesai: item.tanggal_selesai ? String(item.tanggal_selesai).slice(0, 10) : "",
      catatan: item.catatan || "",
    });
    try {
      const res = isAdminCabang ? await adminCabangApi.guru() : await guruApi.list();
      setGurus(res.data.data || []);
    } catch (_) {}
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowBatchDropdown(false);
    setEditingId(null);
  };

  const selectedJadwal = form.batch_id && form.level ? jadwalLevels[`${form.batch_id}-${form.level}`] : null;
  const selectedBatch = form.batch_id ? listBatch.find((b) => String(b.id) === form.batch_id) : null;

  const handleAdd = async () => {
    if (!form.nama_kelas || !form.user_id) return;
    const jadwalKey = `${form.batch_id}-${form.level}`;
    const jadwal = form.batch_id && form.level ? jadwalLevels[jadwalKey] : null;
    const tanggalMulai = jadwal?.tanggal_mulai || form.tanggal_mulai;
    const tanggalSelesai = jadwal?.tanggal_selesai || form.tanggal_selesai;
    if (!tanggalMulai || !tanggalSelesai) return;
    setSubmitting(true);
    try {
      const payload = {
        nama_kelas: form.nama_kelas,
        level: form.level,
        user_id: Number(form.user_id),
        batch_id: form.batch_id ? Number(form.batch_id) : null,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        catatan: form.catatan || null,
      };
      if (editingId) {
        await kelasSenseiApi.update(editingId, payload);
      } else {
        await kelasSenseiApi.store(payload);
      }
      closeModal();
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
    setStartDate(""); setEndDate(""); setFilterSensei(""); setFilterBatch(""); setFilterStatus(""); setPage(1);
  };

  const applyFilter = () => {
    setPage(1);
    fetchData();
  };

  const statusBadge = (status: string) => (
    <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[status] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
      {STATUS_LABEL[status] || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const effectiveStatus = (item: KelasSenseiData): string => {
    if (item.status === "dibatalkan") return "dibatalkan";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mulai = item.tanggal_mulai ? new Date(`${String(item.tanggal_mulai).slice(0, 10)}T00:00:00`) : null;
    const selesai = item.tanggal_selesai ? new Date(`${String(item.tanggal_selesai).slice(0, 10)}T00:00:00`) : null;
    if (selesai && today > selesai) return "selesai";
    if (mulai && today >= mulai && (!selesai || today <= selesai)) return "proses";
    if (mulai && today < mulai) return item.status === "selesai" ? "selesai" : "aktif";
    return item.status === "selesai" ? "selesai" : item.status;
  };

  const filteredData = useMemo(
    () => (filterStatus ? data.filter((d) => effectiveStatus(d) === filterStatus) : data),
    [data, filterStatus]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedData = filteredData.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Kelas</h1>
            <p className="text-sm text-[#5f6368]">Daftar kelas</p>
          </div>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]">
          <Plus size={16} /> Tambah Kelas
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Dari</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Sampai</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
          </div>
          <select value={filterSensei} onChange={(e) => setFilterSensei(e.target.value)} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Sensei</option>
            {listSensei.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Batch</option>
            {listBatch.map((b) => (
              <option key={b.id} value={b.id}>{b.nama_batch}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="proses">Proses Pembelajaran</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <button onClick={applyFilter} className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]">
            <Search size={16} /> Filter
          </button>
          <button onClick={resetFilter} className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-[1000px] border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-12 text-center">No</th>
               <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Batch</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Level</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Nama Sensei</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Tgl Mulai</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Tgl Selesai</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Total Pertemuan</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Absen Terisi</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Alpa</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Izin</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Tidak Absen Pulang</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Pulang Lebih Awal</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-16 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={14} className="px-6 py-12 text-center">
                    <div className="h-3 w-full #e8eaed-\[#e8eaed\]" />
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <BookOpen size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada data kelas sensei</p>
                </td>
              </tr>
            ) : (
              pagedData.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center text-[#80868b]">{(safePage - 1) * perPage + idx + 1}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5 font-semibold text-[#202124]">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: item.batch_relasi?.warna || '#0E6187' }} />
                        {item.batch_relasi?.nama_batch || item.nama_kelas}
                      </span>
                      {item.batch_relasi?.cabang?.nama_cabang ? (
                        <span className="mt-0.5 text-[10px] text-[#80868b]">{item.batch_relasi.cabang.nama_cabang}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <span className="inline-flex bg-[#f1f3f4] px-2 py-0.5 text-[9px] font-medium text-[#5f6368]">{item.level || "-"}</span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{item.user?.name || "-"}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{formatDate(item.tanggal_mulai)}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{formatDate(item.tanggal_selesai)}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium">{item.total_pertemuan}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium">{item.jumlah_absen}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium">{item.jumlah_alpa}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium">{item.jumlah_izin}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium text-[#c5221f]">{item.jumlah_tidak_absen_pulang}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-medium text-[#b06000]">{item.jumlah_pulang_lebih_awal}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">{statusBadge(effectiveStatus(item))}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-[#80868b] transition hover:bg-[#e8f0fe] hover:text-[#1a73e8]" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.nama_kelas)} className="p-1.5 text-[#80868b] transition hover:bg-[#fce8e6] hover:text-[#d93025]" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredData.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>Menampilkan {pagedData.length} dari {filteredData.length} data</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | '...')[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (safePage > 3) pages.push('...');
                const start = Math.max(2, safePage - 1);
                const end = Math.min(totalPages - 1, safePage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (safePage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${ p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}>
                    {p}
                  </button>
                )
              );
            })()}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center #202124-\[#202124\] px-3">
          <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">{editingId ? "Edit Kelas" : "Tambah Kelas"}</h3>
              <button onClick={closeModal} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Nama Kelas <span className="text-[#d93025]">*</span></label>
                <input type="text" value={form.nama_kelas} onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" placeholder="Contoh: Kelas A1" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Level</label>
                <input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" placeholder="Contoh: Beginner" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Sensei <span className="text-[#d93025]">*</span></label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
                  <option value="">Pilih Sensei</option>
                  {gurus.map((g) => (
                    <option key={g.id} value={g.user_id}>{g.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Batch</label>
                <div className="relative">
                  <button type="button" onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                    className="flex w-full items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
                    {selectedBatch ? (
                      <>
                        <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: selectedBatch.warna || '#0E6187' }} />
                        <span className="truncate">{selectedBatch.nama_batch}</span>
                        {selectedBatch.cabang?.nama_cabang ? <span className="ml-auto shrink-0 text-[10px] text-[#80868b]">{selectedBatch.cabang.nama_cabang}</span> : null}
                      </>
                    ) : (
                      <span className="text-[#80868b]">Pilih Batch</span>
                    )}
                  </button>
                  {showBatchDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                      <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)]">
                        <button type="button" onClick={() => { setForm({ ...form, batch_id: "" }); setShowBatchDropdown(false); }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#f8f9fa] ${!form.batch_id ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                          Pilih Batch
                        </button>
                        {listBatch.map((b) => (
                          <button type="button" key={b.id} onClick={() => { setForm({ ...form, batch_id: String(b.id) }); setShowBatchDropdown(false); }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#f8f9fa] ${String(b.id) === form.batch_id ? 'bg-[#e8f0fe] font-semibold' : ''}`}>
                            <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#0E6187' }} />
                            <span className="truncate">{b.nama_batch}</span>
                            {b.cabang?.nama_cabang ? <span className="ml-auto shrink-0 text-[10px] text-[#80868b]">{b.cabang.nama_cabang}</span> : null}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tanggal Mulai <span className="text-[#80868b] font-normal">(otomatis dari jadwal)</span></label>
                  {selectedJadwal ? (
                    <div className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]">
                      {new Date(selectedJadwal.tanggal_mulai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  ) : (
                    <input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Tanggal Selesai <span className="text-[#80868b] font-normal">(otomatis dari jadwal)</span></label>
                  {selectedJadwal ? (
                    <div className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]">
                      {new Date(selectedJadwal.tanggal_selesai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  ) : (
                    <input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Catatan</label>
                <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]" rows={2} placeholder="Catatan (opsional)" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button onClick={closeModal} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
              <button onClick={handleAdd} disabled={submitting || !form.nama_kelas || !form.user_id} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">
                {submitting ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
