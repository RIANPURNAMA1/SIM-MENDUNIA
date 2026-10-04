import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layers, Plus, Pencil, Trash2, RotateCcw, X, Building2, Ban, Filter, ChevronRight, LayoutDashboard } from "lucide-react";
import { batchApi, cabangApi, adminCabangApi } from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";

interface BatchItem {
  id: number
  nama_batch: string
  status: string
  siswas_count: number
  kuota: number | null
  is_penuh: boolean
  is_penuh_manual: boolean
  warna: string | null
  link_grup: string | null
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
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith("/admin-cabang");

  const [data, setData] = useState<BatchItem[]>([]);
  const [cabangList, setCabangList] = useState<CabangOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaBatch, setNamaBatch] = useState("");
  const [batchPrefix, setBatchPrefix] = useState("");
  const [batchDari, setBatchDari] = useState("1");
  const [batchSampai, setBatchSampai] = useState("10");
  const [cabangId, setCabangId] = useState<number | "">("");
  const [kuota, setKuota] = useState<string>("");
  const [warna, setWarna] = useState("#3b82f6");
  const [linkGrup, setLinkGrup] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filterCabang, setFilterCabang] = useState<number | "">("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const filteredData = filterCabang
    ? data.filter(item => item.cabang?.id === filterCabang)
    : data;

  const fetchData = async (p?: number) => {
    setLoading(true);
    const targetPage = p ?? page;
    try {
      const params: Record<string, string | number> = { page: targetPage, per_page: perPage };
      if (filterCabang) params.cabang_id = filterCabang;
      const [batchRes, cabangRes] = await Promise.all([
        isAdminCabang ? adminCabangApi.batches(params) : batchApi.list(params),
        isAdminCabang ? adminCabangApi.myBranches() : cabangApi.list(),
      ]);
      setData(batchRes.data.data || []);
      const pg = batchRes.data.pagination;
      if (pg) {
        setPage(pg.current_page);
        setLastPage(pg.last_page);
        setTotal(pg.total);
      }
      const branches = cabangRes.data?.data || cabangRes.data || [];
      setCabangList(Array.isArray(branches) ? branches : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(1); }, [filterCabang, isAdminCabang]);

  const openAdd = () => {
    setEditId(null);
    setNamaBatch("");
    setBatchPrefix("");
    setBatchDari("1");
    setBatchSampai("10");
    setCabangId("");
    setKuota("");
    setWarna("#3b82f6");
    setLinkGrup("");
    setShowModal(true);
  };

  const openEdit = (item: BatchItem) => {
    setEditId(item.id);
    setNamaBatch(item.nama_batch);
    setCabangId(item.cabang?.id ?? "");
    setKuota(item.kuota ? String(item.kuota) : "");
    setWarna(item.warna || "#3b82f6");
    setLinkGrup(item.link_grup || "");
    setShowModal(true);
  };

  const isBulk = !editId && batchPrefix.trim() && batchDari && batchSampai && Number(batchDari) < Number(batchSampai);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        const payload = { nama_batch: namaBatch.trim(), cabang_id: cabangId || null, kuota: kuota ? Number(kuota) : null, warna, link_grup: linkGrup.trim() || null };
        if (isAdminCabang) await adminCabangApi.batchUpdate(editId, payload);
        else await batchApi.update(editId, payload);
      } else if (isBulk) {
        const dari = Number(batchDari);
        const sampai = Number(batchSampai);
        const batches = [];
        for (let i = dari; i <= sampai; i++) {
          batches.push({ nama_batch: `${batchPrefix.trim()} ${i}`, cabang_id: cabangId || null, kuota: kuota ? Number(kuota) : null, warna, link_grup: linkGrup.trim() || null });
        }
        if (isAdminCabang) await adminCabangApi.batchBulkStore(batches);
        else await batchApi.bulkStore(batches);
      } else {
        if (!namaBatch.trim()) { setSubmitting(false); return; }
        const payload = { nama_batch: namaBatch.trim(), cabang_id: cabangId || null, kuota: kuota ? Number(kuota) : null, warna, link_grup: linkGrup.trim() || null };
        if (isAdminCabang) await adminCabangApi.batchStore(payload);
        else await batchApi.store(payload);
      }
      setShowModal(false);
      setNamaBatch("");
      setBatchPrefix("");
      setBatchDari("1");
      setBatchSampai("10");
      setCabangId("");
      setKuota("");
      setWarna("#3b82f6");
      setLinkGrup("");
      setEditId(null);
      fetchData(1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan batch';
      alert(msg);
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
          if (isAdminCabang) await adminCabangApi.batchDestroy(item.id);
          else await batchApi.destroy(item.id);
          fetchData(page);
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
          if (isAdminCabang) await adminCabangApi.batchToggleStatus(item.id);
          else await batchApi.toggleStatus(item.id);
          fetchData(page);
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
          if (isAdminCabang) await adminCabangApi.batchTogglePenuh(item.id);
          else await batchApi.togglePenuh(item.id);
          fetchData(page);
        } catch (err) {
          console.error(err);
        }
      },
    })
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to={isAdminCabang ? "/admin-cabang" : "/"} className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Batch</span>
      </nav>

      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Batch</h1>
            <p className="text-sm text-[#5f6368]">Kelola data batch siswa</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]">
          <Plus size={16} /> Tambah Batch
        </button>
      </div>

      {/* Filter Cabang */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#80868b]" />
          <span className="text-xs font-medium text-[#5f6368]">Filter Cabang:</span>
        </div>
        <select
          value={filterCabang}
          onChange={(e) => { setFilterCabang(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
          className="border border-[#dadce0] bg-white px-3 py-2 text-xs text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
        >
          <option value="">Semua Cabang</option>
          {cabangList.map((c) => (
            <option key={c.id} value={c.id}>{c.nama_cabang}</option>
          ))}
        </select>
        {filterCabang && (
          <span className="text-xs text-[#80868b]">
            Menampilkan {data.length} batch
          </span>
        )}
      </div>

      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-[600px] border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] text-[#5f6368] ">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-12 text-center">No</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Nama Batch</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Cabang</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Kuota</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-12 text-center"><div className="h-3 w-full bg-[#e8eaed]/70" /></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]"><Layers size={24} /></div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">
                    {filterCabang ? "Tidak ada batch untuk cabang ini" : "Belum ada data batch"}
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center text-[#80868b]">{idx + 1}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 font-semibold text-[#202124]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: item.warna || '#3b82f6' }}>
                      {item.nama_batch}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">
                    {item.cabang ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} className="text-[#80868b]" />
                        {item.cabang.nama_cabang}
                      </span>
                    ) : (
                      <span className="text-[#9aa0a6]">—</span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold ${item.status === "AKTIF" ? "bg-[#0E6187] text-white" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    {item.kuota ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium ${item.is_penuh ? 'bg-[#f6d7d5] text-[#a50e0e]' : 'bg-[#d2e3fc] text-[#1967d2]'}`}>
                        {item.siswas_count}/{item.kuota}
                        {item.is_penuh && <span className="font-semibold">Penuh</span>}
                      </span>
                    ) : (
                      <span className="inline-flex bg-[#d2e3fc] px-2 py-0.5 text-[9px] font-medium text-[#1967d2]">
                        {item.siswas_count} siswa
                      </span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-[#80868b] transition hover:bg-[#fef7e0] hover:text-[#b06000]" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-[#80868b] transition hover:bg-[#fce8e6] hover:text-[#d93025]" title="Hapus"><Trash2 size={13} /></button>
                      <button onClick={() => handleToggleStatus(item)} className="p-1.5 text-[#80868b] transition hover:bg-[#e8f0fe] hover:text-[#1a73e8]" title="Aktif/Nonaktif"><RotateCcw size={13} /></button>
                      <button onClick={() => handleTogglePenuh(item)} className={`p-1.5 transition ${item.is_penuh_manual ? 'text-[#d93025] hover:bg-[#fce8e6] hover:text-[#a50e0e]' : 'text-[#80868b] hover:bg-[#fef7e0] hover:text-[#e37400]'}`} title={item.is_penuh_manual ? 'Tandai Tidak Penuh' : 'Tandai Penuh'}><Ban size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-[#dadce0] bg-white px-4 py-3">
            <span className="text-xs text-[#5f6368]">
              {total} batch — halaman {page} dari {lastPage}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(1)} disabled={page === 1}
                className="border border-[#dadce0] px-2.5 py-1 text-xs text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-40">
                Awal
              </button>
              <button onClick={() => fetchData(page - 1)} disabled={page === 1}
                className="border border-[#dadce0] px-2.5 py-1 text-xs text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-40">
                Prev
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, lastPage - 4));
                const p = start + i;
                if (p > lastPage) return null;
                return (
                  <button key={p} onClick={() => fetchData(p)}
                    className={`border px-2.5 py-1 text-xs transition ${p === page ? 'border-[#3c4043] bg-[#202124] text-white' : 'border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => fetchData(page + 1)} disabled={page === lastPage}
                className="border border-[#dadce0] px-2.5 py-1 text-xs text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-40">
                Next
              </button>
              <button onClick={() => fetchData(lastPage)} disabled={page === lastPage}
                className="border border-[#dadce0] px-2.5 py-1 text-xs text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-40">
                Akhir
              </button>
            </div>
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 px-3">
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">{editId ? "Edit Batch" : "Tambah Batch"}</h3>
              <button onClick={() => { setShowModal(false); setNamaBatch(""); setCabangId(""); setKuota(""); setWarna("#3b82f6"); setLinkGrup(""); setEditId(null); }} className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-4 py-4 space-y-4">
                {editId ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Nama Batch <span className="text-[#d93025]">*</span></label>
                    <input type="text" value={namaBatch} onChange={(e) => setNamaBatch(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="Contoh: Batch 14" required autoFocus />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Nama Batch <span className="text-[#d93025]">*</span></label>
                      <input type="text" value={namaBatch} onChange={(e) => setNamaBatch(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="Batch" />
                      <p className="mt-1 text-[10px] text-[#80868b]">Isi untuk 1 batch. Kosongi jika ingin buat banyak batch otomatis.</p>
                    </div>
                    <div className="border-t border-[#dadce0] pt-3">
                      <p className="mb-2 text-xs font-semibold text-[#5f6368]">Buat Banyak Batch Otomatis</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-[#80868b]">Prefiks Nama</label>
                          <input type="text" value={batchPrefix} onChange={(e) => setBatchPrefix(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="Batch" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-[#80868b]">Dari</label>
                          <input type="number" min="1" value={batchDari} onChange={(e) => setBatchDari(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-[#80868b]">Sampai</label>
                          <input type="number" min="1" value={batchSampai} onChange={(e) => setBatchSampai(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                        </div>
                        <div className="flex items-end pb-1">
                          {batchPrefix.trim() && batchDari && batchSampai && Number(batchDari) <= Number(batchSampai) && (
                            <span className="text-[11px] text-[#137333] font-medium">
                              Akan buat {Number(batchSampai) - Number(batchDari) + 1} batch
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Cabang</label>
                  <select value={cabangId} onChange={(e) => setCabangId(e.target.value ? Number(e.target.value) : "")} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]">
                    <option value="">Pilih Cabang</option>
                    {cabangList.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Kuota Siswa <span className="font-normal text-[#80868b]">(kosongi jika tidak terbatas)</span></label>
                  <input type="number" min="1" value={kuota} onChange={(e) => setKuota(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="Contoh: 50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Warna Badge</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={warna} onChange={e => setWarna(e.target.value)} className="h-9 w-9 cursor-pointer border border-[#dadce0] p-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#6366f1','#84cc16','#e11d48'].map(c => (
                        <button key={c} type="button" onClick={() => setWarna(c)} className={`h-6 w-6 border-2 transition ${warna === c ? 'border-[#3c4043] scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: warna }}>{namaBatch || 'Preview'}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5f6368]">Link Grup</label>
                  <input type="url" value={linkGrup} onChange={(e) => setLinkGrup(e.target.value)} className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" placeholder="https://chat.whatsapp.com/..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
                <button type="button" onClick={() => { setShowModal(false); setNamaBatch(""); setCabangId(""); setKuota(""); setWarna("#3b82f6"); setLinkGrup(""); setEditId(null); }} className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" disabled={submitting || (editId ? !namaBatch.trim() : (!namaBatch.trim() && !isBulk))} className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50">
                  {submitting ? "Menyimpan..." : editId ? "Simpan" : isBulk ? `Buat ${Number(batchSampai) - Number(batchDari) + 1} Batch` : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
