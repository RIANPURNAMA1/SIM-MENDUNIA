import { useState, useEffect } from "react";
import { ClipboardCheck, Search, RotateCcw, Plus, Users, Pencil } from "lucide-react";
import { absensiSiswaApi, kelasSenseiApi } from "../services/api";
import type { AbsensiSiswaItem, KelasSenseiData } from "../types";

const STATUS_STYLE: Record<string, string> = {
  HADIR: "bg-emerald-100 text-emerald-700",
  TERLAMBAT: "bg-amber-100 text-amber-700",
  IZIN: "bg-blue-100 text-blue-700",
  SAKIT: "bg-sky-100 text-sky-700",
  ALPA: "bg-rose-100 text-rose-700",
  LIBUR: "bg-slate-100 text-slate-700",
};

const STATUS_OPTIONS = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALPA", "LIBUR"];

interface OptionItem {
  id: number;
  nama: string;
}

export default function AbsensiSiswaPage() {
  const [data, setData] = useState<AbsensiSiswaItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasSenseiData[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModalManual, setShowModalManual] = useState(false);
  const [showModalMassal, setShowModalMassal] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [siswaByKelas, setSiswaByKelas] = useState<OptionItem[]>([]);
  const [massalData, setMassalData] = useState<{ siswa_id: number; nama: string; status: string; keterangan: string }[]>([]);

  const emptyForm = { siswa_id: "", tanggal: filterTanggal, jam_masuk: "", jam_keluar: "", status: "HADIR", keterangan: "", kelas_sensei_id: "" };
  const [form, setForm] = useState(emptyForm);

  const [editForm, setEditForm] = useState({ jam_masuk: "", jam_keluar: "", status: "HADIR", keterangan: "" });

  const [massalForm, setMassalForm] = useState({ kelas_sensei_id: "", tanggal: filterTanggal, jam_masuk: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { tanggal: filterTanggal };
      if (filterKelas) params.kelas_sensei_id = filterKelas;
      if (filterStatus) params.status = filterStatus;
      const res = await absensiSiswaApi.list(params);
      setData(res.data.data || []);
      setKelasList(res.data.kelas_list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterTanggal]);

  const handleFilter = () => {
    fetchData();
  };

  const resetFilter = () => {
    setFilterTanggal(new Date().toISOString().slice(0, 10));
    setFilterKelas("");
    setFilterStatus("");
  };

  const fotoUrl = (s: AbsensiSiswaItem["siswa"]) => {
    if (s?.foto) return `http://localhost:8000/uploads/siswa/${s.foto}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(s?.nama || "")}&background=e5e7eb&color=6b7280&size=32`;
  };

  const kelasLabel = (item: AbsensiSiswaItem): string => {
    if (item.kelas_sensei) return item.kelas_sensei.nama_kelas;
    if (item.siswa?.batch_relasi && item.siswa?.level) {
      return `${item.siswa.batch_relasi.nama_batch} Level ${item.siswa.level}`;
    }
    return item.siswa?.kelas || "-";
  };

  const loadSiswaByKelas = async (kelasId: number) => {
    try {
      const res = await absensiSiswaApi.siswaByKelas(kelasId);
      setSiswaByKelas(res.data || []);
    } catch (_) {
      setSiswaByKelas([]);
    }
  };

  const openModalManual = async () => {
    setForm({ ...emptyForm, tanggal: filterTanggal });
    if (filterKelas) {
      setForm((prev) => ({ ...prev, kelas_sensei_id: filterKelas }));
      await loadSiswaByKelas(Number(filterKelas));
    } else {
      setSiswaByKelas([]);
    }
    setShowModalManual(true);
  };

  const handleManualKelasChange = async (val: string) => {
    setForm((prev) => ({ ...prev, kelas_sensei_id: val, siswa_id: "" }));
    if (val) {
      await loadSiswaByKelas(Number(val));
    } else {
      setSiswaByKelas([]);
    }
  };

  const handleStoreManual = async () => {
    if (!form.siswa_id || !form.tanggal || !form.status) return;
    setSubmitting(true);
    try {
      await absensiSiswaApi.store({
        siswa_id: Number(form.siswa_id),
        tanggal: form.tanggal,
        jam_masuk: form.jam_masuk || null,
        jam_keluar: form.jam_keluar || null,
        status: form.status,
        keterangan: form.keterangan || null,
        kelas_sensei_id: form.kelas_sensei_id ? Number(form.kelas_sensei_id) : null,
      });
      setShowModalManual(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openModalMassal = async () => {
    setMassalForm({ kelas_sensei_id: filterKelas, tanggal: filterTanggal, jam_masuk: "" });
    setMassalData([]);
    if (filterKelas) {
      await loadMassalSiswa(filterKelas);
    }
    setShowModalMassal(true);
  };

  const loadMassalSiswa = async (kelasId: string) => {
    if (!kelasId) {
      setMassalData([]);
      return;
    }
    try {
      const res = await absensiSiswaApi.siswaByKelas(Number(kelasId));
      const list: OptionItem[] = res.data || [];
      setMassalData(list.map((s) => ({ siswa_id: s.id, nama: s.nama, status: "HADIR", keterangan: "" })));
    } catch (_) {
      setMassalData([]);
    }
  };

  const handleMassalKelasChange = async (val: string) => {
    setMassalForm((prev) => ({ ...prev, kelas_sensei_id: val }));
    await loadMassalSiswa(val);
  };

  const updateMassalRow = (index: number, field: "status" | "keterangan", value: string) => {
    setMassalData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleStoreMassal = async () => {
    if (!massalForm.tanggal || massalData.length === 0) return;
    setSubmitting(true);
    try {
      await absensiSiswaApi.massStore({
        tanggal: massalForm.tanggal,
        jam_masuk: massalForm.jam_masuk || null,
        kelas_sensei_id: massalForm.kelas_sensei_id ? Number(massalForm.kelas_sensei_id) : null,
        data: massalData.map((d) => ({
          siswa_id: d.siswa_id,
          status: d.status,
          keterangan: d.keterangan || null,
        })),
      });
      setShowModalMassal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openModalEdit = async (item: AbsensiSiswaItem) => {
    setEditId(item.id);
    setEditForm({
      jam_masuk: item.jam_masuk || "",
      jam_keluar: item.jam_keluar || "",
      status: item.status,
      keterangan: item.keterangan || "",
    });
    setShowModalEdit(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setSubmitting(true);
    try {
      await absensiSiswaApi.update(editId, {
        jam_masuk: editForm.jam_masuk || null,
        jam_keluar: editForm.jam_keluar || null,
        status: editForm.status,
        keterangan: editForm.keterangan || null,
      });
      setShowModalEdit(false);
      setEditId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Absensi Siswa</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openModalManual} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Input Manual
          </button>
          <button onClick={openModalMassal} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Users className="w-4 h-4" /> Absensi Massal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button onClick={handleFilter} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Search className="w-4 h-4" /> Cari
          </button>
          <button onClick={resetFilter} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Pulang</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Belum ada data absensi untuk tanggal ini</td></tr>
              ) : data.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={fotoUrl(item.siswa)} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                      <span className="text-sm font-medium text-gray-800">{item.siswa?.nama || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                      {kelasLabel(item)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.jam_masuk || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.jam_keluar || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[item.status] || "bg-gray-100 text-gray-700"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{item.keterangan || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openModalEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModalManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModalManual(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Input Absensi Manual</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Kelas</label>
                <select value={form.kelas_sensei_id} onChange={(e) => handleManualKelasChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Pilih Kelas (opsional)</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Siswa <span className="text-red-500">*</span></label>
                <select value={form.siswa_id} onChange={(e) => setForm((prev) => ({ ...prev, siswa_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Pilih Siswa</option>
                  {siswaByKelas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
                {!form.kelas_sensei_id && (
                  <p className="text-xs text-amber-600 mt-1">Pilih kelas untuk menampilkan daftar siswa</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal <span className="text-red-500">*</span></label>
                  <input type="date" value={form.tanggal} onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status <span className="text-red-500">*</span></label>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Masuk</label>
                  <input type="time" value={form.jam_masuk} onChange={(e) => setForm((prev) => ({ ...prev, jam_masuk: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Pulang</label>
                  <input type="time" value={form.jam_keluar} onChange={(e) => setForm((prev) => ({ ...prev, jam_keluar: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Keterangan</label>
                <textarea value={form.keterangan} onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowModalManual(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleStoreManual} disabled={submitting || !form.siswa_id || !form.tanggal} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalMassal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModalMassal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Absensi Massal</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Kelas <span className="text-red-500">*</span></label>
                  <select value={massalForm.kelas_sensei_id} onChange={(e) => handleMassalKelasChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Pilih Kelas</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal <span className="text-red-500">*</span></label>
                  <input type="date" value={massalForm.tanggal} onChange={(e) => setMassalForm((prev) => ({ ...prev, tanggal: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Masuk (default)</label>
                  <input type="time" value={massalForm.jam_masuk} onChange={(e) => setMassalForm((prev) => ({ ...prev, jam_masuk: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {massalData.length > 0 && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Siswa</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-36">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {massalData.map((row, i) => (
                        <tr key={row.siswa_id}>
                          <td className="px-3 py-2 text-sm text-gray-800">{row.nama}</td>
                          <td className="px-3 py-2">
                            <select value={row.status} onChange={(e) => updateMassalRow(i, "status", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500">
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" value={row.keterangan} onChange={(e) => updateMassalRow(i, "keterangan", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500" placeholder="Opsional" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!massalForm.kelas_sensei_id && (
                <p className="text-sm text-amber-600">Pilih kelas untuk memuat daftar siswa</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowModalMassal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleStoreMassal} disabled={submitting || massalData.length === 0 || !massalForm.tanggal} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModalEdit(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Edit Absensi</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Masuk</label>
                  <input type="time" value={editForm.jam_masuk} onChange={(e) => setEditForm((prev) => ({ ...prev, jam_masuk: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Pulang</label>
                  <input type="time" value={editForm.jam_keluar} onChange={(e) => setEditForm((prev) => ({ ...prev, jam_keluar: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status <span className="text-red-500">*</span></label>
                <select value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Keterangan</label>
                <textarea value={editForm.keterangan} onChange={(e) => setEditForm((prev) => ({ ...prev, keterangan: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowModalEdit(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleUpdate} disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
