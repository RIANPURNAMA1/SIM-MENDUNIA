import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CalendarPlus,
  Venus,
  Mars,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { karyawanApi, referensiApi } from "../../services/api";
import type {
  Karyawan,
  Divisi,
  Cabang,
  Shift,
  Pagination,
  KaryawanForm,
  FormModalState,
  DetailResponse,
} from "../../types";

const statusKerjaBadge = (status: string) => {
  // Hanya menggunakan warna untuk titik kecil (dot indicator)
  const dotColor: Record<string, string> = {
    TETAP: "bg-emerald-500",
    KONTRAK: "bg-amber-500",
    MAGANG: "bg-blue-500",
  };

  const label: Record<string, string> = {
    TETAP: "Tetap",
    KONTRAK: "Kontrak",
    MAGANG: "Magang",
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status] || "bg-slate-300"}`} />
      {label[status] || status || "-"}
    </span>
  );
};

export default function KaryawanPage() {
  const [data, setData] = useState<Karyawan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterCabang, setFilterCabang] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Karyawan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [formModal, setFormModal] = useState<FormModalState>({
    show: false,
    editing: null,
    submitting: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  }, []);

  const [form, setForm] = useState<KaryawanForm>({
    nik: "",
    nip: "",
    name: "",
    jabatan: "",
    cabang_ids: [],
    divisi_id: "",
    shift_ids: [],
    no_hp: "",
    email: "",
    pendidikan_terakhir: "",
    status_kerja: "",
    tanggal_masuk: "",
    jenis_kelamin: "",
    agama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    status_pernikahan: "",
    alamat: "",
    can_access_khusus: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (search) params.search = search;
      if (filterDivisi) params.divisi_id = filterDivisi;
      if (filterCabang) params.cabang_id = filterCabang;
      const res = await karyawanApi.list(params);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterDivisi, filterCabang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    referensiApi
      .divisi()
      .then((r) => setDivisiList(r.data.data))
      .catch(() => {});
    referensiApi
      .cabang()
      .then((r) => setCabangList(r.data.data))
      .catch(() => {});
    referensiApi
      .shiftAktif()
      .then((r) => setShiftList(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await karyawanApi.delete(selected.id);
      setShowDelete(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      alert(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (item: Karyawan) => {
    setTogglingId("status-" + item.id);
    try {
      await karyawanApi.toggleStatus(item.id);
      await fetchData();
    } catch (err) {
      alert(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleKhusus = async (item: Karyawan) => {
    setTogglingId("khusus-" + item.id);
    try {
      await karyawanApi.toggleKhusus(item.id);
      await fetchData();
    } catch (err) {
      alert(err);
    } finally {
      setTogglingId(null);
    }
  };

  const openDetail = async (item: Karyawan) => {
    setSelected(item);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const res = await karyawanApi.detail(item.id);
      setDetailData(res.data);
    } catch (err) {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilter = () => {
    setFilterDivisi("");
    setFilterCabang("");
    setSearch("");
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      nik: "",
      nip: "",
      name: "",
      jabatan: "",
      cabang_ids: [],
      divisi_id: "",
      shift_ids: [],
      no_hp: "",
      email: "",
      pendidikan_terakhir: "",
      status_kerja: "",
      tanggal_masuk: "",
      jenis_kelamin: "",
      agama: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      status_pernikahan: "",
      alamat: "",
      can_access_khusus: false,
    });
  };

  const openCreate = () => {
    resetForm();
    setFormModal({ show: true, editing: null, submitting: false });
  };

  const openEdit = async (item: Karyawan) => {
    setSelected(item);
    try {
      const res = await karyawanApi.detail(item.id);
      const d = res.data.data;
      setForm({
        nik: d.nik || "",
        name: d.name || "",
        nip: d.nip || "",
        jabatan: d.jabatan || "",
        cabang_ids: (d.cabang_ids || []).map(Number),
        divisi_id: d.divisi_id || "",
        shift_ids: (d.shift_ids || []).map(Number),
        no_hp: d.no_hp || "",
        email: d.email || "",
        pendidikan_terakhir: d.pendidikan_terakhir || "",
        status_kerja: d.status_kerja || "",
        tanggal_masuk: d.tanggal_masuk || "",
        jenis_kelamin: d.jenis_kelamin || "",
        agama: d.agama || "",
        tempat_lahir: d.tempat_lahir || "",
        tanggal_lahir: d.tanggal_lahir || "",
        status_pernikahan: d.status_pernikahan || "",
        alamat: d.alamat || "",
        can_access_khusus: !!d.can_access_khusus,
      });
      setFormModal({ show: true, editing: item, submitting: false });
    } catch (err) {
      alert(err);
    }
  };

  const closeFormModal = () => {
    setFormModal({ show: false, editing: null, submitting: false });
    resetForm();
  };

  const handleFormChange = (field: keyof KaryawanForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleArray = (
    field: "cabang_ids" | "shift_ids",
    val: number,
  ) => {
    setForm((prev) => {
      const arr = prev[field] || [];
      const exists = arr.includes(val);
      return {
        ...prev,
        [field]: exists ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormModal((prev) => ({ ...prev, submitting: true }));
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === "cabang_ids" || key === "shift_ids") {
          ((val as number[]) || []).forEach((v) =>
            fd.append(`${key}[]`, String(v)),
          );
        } else if (key === "can_access_khusus") {
          if (val) fd.append(key, "1");
        } else if (
          key === "foto_profil" ||
          key === "foto_ktp" ||
          key === "foto_ijazah" ||
          key === "foto_kk" ||
          key === "cv_file" ||
          key === "sertifikat_file"
        ) {
          if (val instanceof File) fd.append(key, val);
        } else {
          fd.append(key, String(val));
        }
      });

      if (formModal.editing) {
        await karyawanApi.update(formModal.editing.id, fd);
        showSuccess("Karyawan berhasil diperbarui");
      } else {
        await karyawanApi.create(fd);
        showSuccess("Karyawan berhasil ditambahkan");
      }

      closeFormModal();
      fetchData();
    } catch (err) {
      alert(err);
    } finally {
      setFormModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Success Alert */}
      {successMessage && (
        <div className="mb-4 animate-slide-down">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg  p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[0D1F3C] text-[0D1F3C] border border-blue-100">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Data Karyawan
            </h1>
            <p className="text-sm text-slate-500">
              Master data seluruh karyawan
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            <Plus size={16} />
            Tambah
          </button>
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200">
            <CalendarPlus size={16} />
            Atur Shift
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg  p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCabang}
            onChange={(e) => {
              setFilterCabang(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Cabang</option>
            <option value="1">Cabang Jakarta</option>
            {cabangList?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama_cabang}
              </option>
            ))}
          </select>
          <select
            value={filterDivisi}
            onChange={(e) => {
              setFilterDivisi(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Divisi</option>
            {divisiList?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama_divisi}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto  ">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className=" text-sm text-slate-600">
              <tr>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 bg-slate-100 focus:ring-2 focus:ring-blue-200"
                    />
                    <label className="sr-only">Table checkbox</label>
                  </div>
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Karyawan
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Cabang
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Departemen
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Jabatan
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  L/P
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Status Kerja
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Akun
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Absen Khusus
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td
                      colSpan={10}
                      className="border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200/70" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-200/70" />
                          <div className="h-2.5 w-24 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="border border-slate-200 px-6 py-10 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Users size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Tidak ada data karyawan
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white transition hover:bg-slate-50"
                  >
                    <td className="w-4 border border-slate-200 px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 bg-slate-100 focus:ring-2 focus:ring-blue-200"
                        />
                        <label className="sr-only">Table checkbox</label>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.nip || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {item.cabang && item.cabang.length > 0 ? (
                        item.cabang.map((c) => c.nama_cabang).join(", ")
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {item.divisi?.nama_divisi || "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {item.jabatan || "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold">
                      {item.jenis_kelamin === "L" ? (
                        <span className="text-blue-600">L</span>
                      ) : item.jenis_kelamin === "P" ? (
                        <span className="text-pink-600">P</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {statusKerjaBadge(item.status_kerja)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={item.status === "AKTIF"}
                            onChange={() => handleToggleStatus(item)}
                            disabled={togglingId === "status-" + item.id}
                          />
                        </label>
                        <span
                          className={`text-[10px] font-semibold ${item.status === "AKTIF" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          checked={item.can_access_khusus}
                          onChange={() => handleToggleKhusus(item)}
                          disabled={togglingId === "khusus-" + item.id}
                        />
                      </label>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openDetail(item)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          title="Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelected(item);
                            setShowDelete(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Halaman {pagination.current_page} dari {pagination.last_page}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-12 p-3 sm:p-4"
          onClick={() => setShowDetail(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h5 className="font-bold text-gray-900 m-0">
                  Detail Profil Karyawan
                </h5>
                <span className="text-[11px] text-blue-600 font-medium">
                  ID Karyawan: #{selected.id}
                </span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-10 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-400">Memuat detail...</p>
              </div>
            ) : (
              <div className="p-5">
                {(() => {
                  const d = detailData?.data || selected;
                  const detailCabang = detailData?.cabang || [];
                  const detailShifts = detailData?.shifts || [];
                  return (
                    <>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-72 shrink-0">
                          <div className="text-center md:border-r md:border-gray-100 md:pr-6">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=1877f2&color=fff&size=200`}
                              className="rounded-xl shadow-sm mx-auto"
                              style={{
                                width: 180,
                                height: 220,
                                objectFit: "cover",
                                border: "4px solid #f8f9fa",
                              }}
                            />
                            <h5 className="text-blue-600 font-bold mt-3 mb-0">
                              {d.name}
                            </h5>
                            <p className="text-gray-500 text-sm fw-bold font-semibold">
                              {d.jabatan || "-"}
                            </p>
                            <hr className="my-3" />
                            <div className="text-left">
                              <p className="text-[11px] text-gray-400 font-semibold mb-1.5">
                                Shift Kerja:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {detailShifts.length > 0 ? (
                                  detailShifts.map((s, i) => (
                                    <span
                                      key={i}
                                      className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium"
                                    >
                                      {s.nama_shift}
                                    </span>
                                  ))
                                ) : d.shift ? (
                                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                    {d.shift.nama_shift}
                                  </span>
                                ) : d.shift_ids?.length > 0 ? (
                                  d.shift_ids.map((sid, i) => (
                                    <span
                                      key={i}
                                      className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium"
                                    >
                                      Shift #{sid}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400">
                                    -
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <tbody>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    NIK (No. KTP)
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800 font-medium">
                                    {d.nik || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    NIP
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.nip || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Pendidikan Terakhir
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-medium">
                                      {d.pendidikan_terakhir || "-"}
                                    </span>
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Divisi
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.divisi?.nama_divisi || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Cabang
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {detailCabang.length > 0
                                      ? detailCabang
                                          .map((c) => c.nama_cabang)
                                          .join(", ")
                                      : "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    No HP / WhatsApp
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {d.no_hp ? (
                                      <a
                                        href={`https://wa.me/${d.no_hp.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {d.no_hp}
                                      </a>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Email Perusahaan
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.email || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Tempat, Tanggal Lahir
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {[d.tempat_lahir, d.tanggal_lahir]
                                      .filter(Boolean)
                                      .join(", ") || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Jenis Kelamin
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.jenis_kelamin === "L"
                                      ? "Laki-laki"
                                      : d.jenis_kelamin === "P"
                                        ? "Perempuan"
                                        : "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Agama
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.agama || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Status Pernikahan
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.status_pernikahan
                                      ? d.status_pernikahan.replace(/_/g, " ")
                                      : "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Tanggal Masuk
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.tanggal_masuk || "-"}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l">
                                    Status Kerja
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {statusKerjaBadge(d.status_kerja)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-2.5 pr-4 text-[12px] text-gray-500 font-semibold w-44 bg-gray-50/50 px-3 rounded-l align-top">
                                    Alamat Lengkap
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-800">
                                    {d.alamat || "-"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                            <h6 className="text-sm font-semibold m-0">
                              Berkas & Dokumen
                            </h6>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {[
                              {
                                label: "Foto KTP",
                                key: "foto_ktp",
                                file: (d as any).foto_ktp,
                              },
                              {
                                label: "Foto Ijazah",
                                key: "foto_ijazah",
                                file: (d as any).foto_ijazah,
                              },
                              {
                                label: "Foto KK",
                                key: "foto_kk",
                                file: (d as any).foto_kk,
                              },
                              {
                                label: "Curriculum Vitae (CV)",
                                key: "cv_file",
                                file: (d as any).cv_file,
                              },
                              {
                                label: "Sertifikat Lainnya",
                                key: "sertifikat_file",
                                file: (d as any).sertifikat_file,
                              },
                            ].map((doc) => (
                              <div
                                key={doc.label}
                                className="flex items-center justify-between px-4 py-2.5"
                              >
                                <span className="text-sm text-gray-700">
                                  {doc.label}
                                </span>
                                {doc.file ? (
                                  <a
                                    href={`http://localhost:8000/uploads/${doc.key}/${doc.file}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-blue-600 hover:underline"
                                  >
                                    Lihat
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Tidak ada
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                            <h6 className="text-sm font-semibold m-0">
                              Informasi Akun
                            </h6>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Email Login</span>
                              <span className="text-gray-800 font-medium">
                                {d.email}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Role Akses</span>
                              <span className="text-[11px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {d.role}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Status Akun</span>
                              {d.status === "AKTIF" ? (
                                <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                  AKTIF
                                </span>
                              ) : (
                                <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                                  NONAKTIF
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Terakhir Login
                              </span>
                              <span className="text-gray-600">
                                {d.last_login
                                  ? new Date(d.last_login).toLocaleString(
                                      "id-ID",
                                    )
                                  : "Belum pernah login"}
                              </span>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-700">
                              Password default karyawan adalah{" "}
                              <code className="bg-blue-100 px-1 rounded">
                                12345678
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {formModal.show && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-10 p-3 sm:p-4"
          onClick={closeFormModal}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleFormSubmit}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h5 className="font-bold text-gray-900 m-0">
                    {formModal.editing
                      ? "Edit Data Karyawan"
                      : "Tambah Karyawan"}
                  </h5>
                  <span className="text-[11px] text-blue-600 font-medium">
                    {formModal.editing
                      ? "Perbarui data karyawan"
                      : "Isi form untuk menambahkan karyawan baru"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      NIK (No. KTP) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nik}
                      onChange={(e) => handleFormChange("nik", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="16 digit NIK"
                      maxLength={16}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      NIP
                    </label>
                    <input
                      type="text"
                      value={form.nip || ""}
                      onChange={(e) => handleFormChange("nip", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
                      placeholder={formModal.editing ? "" : "Otomatis"}
                      readOnly={!formModal.editing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Nama tanpa gelar"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Jabatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.jabatan}
                      onChange={(e) =>
                        handleFormChange("jabatan", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Contoh: Staff Admin"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pendidikan Terakhir{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.pendidikan_terakhir}
                      onChange={(e) =>
                        handleFormChange("pendidikan_terakhir", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Pilih Opsi --</option>
                      <option value="SD/MI">SD/MI</option>
                      <option value="SMP/MTS">SMP/MTS</option>
                      <option value="SMA/SMK">SMA/SMK</option>
                      <option value="D3">D3</option>
                      <option value="D4">D4</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Divisi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.divisi_id}
                      onChange={(e) =>
                        handleFormChange("divisi_id", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Pilih Divisi --</option>
                      {divisiList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nama_divisi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status Kerja <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.status_kerja}
                      onChange={(e) =>
                        handleFormChange("status_kerja", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Pilih Status --</option>
                      <option value="TETAP">Tetap</option>
                      <option value="KONTRAK">Kontrak</option>
                      <option value="MAGANG">Magang</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Masuk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.tanggal_masuk}
                      onChange={(e) =>
                        handleFormChange("tanggal_masuk", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      No. HP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.no_hp}
                      onChange={(e) =>
                        handleFormChange("no_hp", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="08xxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        handleFormChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="email@perusahaan.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={form.tempat_lahir}
                      onChange={(e) =>
                        handleFormChange("tempat_lahir", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={form.tanggal_lahir}
                      onChange={(e) =>
                        handleFormChange("tanggal_lahir", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={form.jenis_kelamin}
                      onChange={(e) =>
                        handleFormChange("jenis_kelamin", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Agama
                    </label>
                    <select
                      value={form.agama}
                      onChange={(e) =>
                        handleFormChange("agama", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="ISLAM">Islam</option>
                      <option value="KRISTEN">Kristen</option>
                      <option value="KATOLIK">Katolik</option>
                      <option value="HINDU">Hindu</option>
                      <option value="BUDDHA">Buddha</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status Pernikahan
                    </label>
                    <select
                      value={form.status_pernikahan}
                      onChange={(e) =>
                        handleFormChange("status_pernikahan", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="BELUM MENIKAH">Belum Menikah</option>
                      <option value="MENIKAH">Menikah</option>
                      <option value="CERAI">Cerai</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.can_access_khusus}
                        onChange={(e) =>
                          handleFormChange(
                            "can_access_khusus",
                            e.target.checked,
                          )
                        }
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
                    </label>
                    <span className="ml-3 text-sm font-semibold text-gray-700">
                      Akses Absen Khusus
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-2">
                    Penempatan Cabang <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cabangList.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(form.cabang_ids || []).includes(c.id)}
                            onChange={() =>
                              handleToggleArray("cabang_ids", c.id)
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {c.nama_cabang}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 mb-0">
                      Centang satu atau lebih cabang untuk lokasi absensi
                      karyawan.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-2">
                    Shift Kerja <span className="text-red-500">*</span>
                  </label>
                  <div
                    className="border border-blue-100 rounded-lg p-3 bg-blue-50/30"
                    style={{ maxHeight: 150, overflowY: "auto" }}
                  >
                    {shiftList.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        Tidak ada shift tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {shiftList.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(form.shift_ids || []).includes(s.id)}
                              onChange={() =>
                                handleToggleArray("shift_ids", s.id)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700">
                                {s.nama_shift}
                              </span>
                              <span className="text-gray-400 ml-1">
                                {s.jam_masuk?.substring(0, 5)} -{" "}
                                {s.jam_pulang?.substring(0, 5)}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2 mb-0">
                      Centang satu atau lebih shift
                    </p>
                  </div>
                </div>

                {/* Upload Dokumen */}
                <div>
                  <hr className="my-2" />
                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Upload Dokumen
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Foto Profil
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFormChange(
                            "foto_profil",
                            (e.target as HTMLInputElement).files?.[0],
                          )
                        }
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Foto KTP
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFormChange(
                            "foto_ktp",
                            (e.target as HTMLInputElement).files?.[0],
                          )
                        }
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        CV (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          handleFormChange(
                            "cv_file",
                            (e.target as HTMLInputElement).files?.[0],
                          )
                        }
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                  {formModal.editing && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Foto Ijazah
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFormChange(
                              "foto_ijazah",
                              (e.target as HTMLInputElement).files?.[0],
                            )
                          }
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Foto KK
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFormChange(
                              "foto_kk",
                              (e.target as HTMLInputElement).files?.[0],
                            )
                          }
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Sertifikat
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            handleFormChange(
                              "sertifikat_file",
                              (e.target as HTMLInputElement).files?.[0],
                            )
                          }
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Alamat Sesuai KTP
                  </label>
                  <textarea
                    value={form.alamat}
                    onChange={(e) => handleFormChange("alamat", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2}
                    placeholder="Alamat lengkap..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formModal.submitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "#1E2939" }}
                >
                  {formModal.submitting
                    ? "Menyimpan..."
                    : formModal.editing
                      ? "Simpan Perubahan"
                      : "Simpan Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowDelete(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 sm:p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Hapus Karyawan</h3>
            <p className="text-sm text-gray-500 mb-5">
              Yakin ingin menghapus <strong>{selected.name}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
