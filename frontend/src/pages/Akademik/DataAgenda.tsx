import { useState, useEffect, useCallback } from "react";
import { Calendar, Search, RotateCcw, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { agendaApi, APP_URL } from "../../services/api";
import type { Agenda, Divisi, Cabang, Pagination } from "../../types";

export default function DataAgendaPage() {
  const now = new Date();
  const [data, setData] = useState<Agenda[]>([]);
  const [listCabang, setListCabang] = useState<Cabang[]>([]);
  const [listDivisi, setListDivisi] = useState<Divisi[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().split("T")[0];
  });
  const [filterCabang, setFilterCabang] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        start_date: startDate,
        end_date: endDate,
        per_page: 20,
        page,
      };
      if (filterCabang) params.cabang_id = filterCabang;
      if (filterDivisi) params.divisi_id = filterDivisi;
      const res = await agendaApi.list(params);
      setData(res.data.data || []);
      setListCabang(res.data.list_cabang || []);
      setListDivisi(res.data.list_divisi || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterCabang, filterDivisi, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, filterCabang, filterDivisi]);

  const resetFilter = () => {
    const d = new Date();
    const sd = new Date(d.getFullYear(), d.getMonth(), 1);
    const ed = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setStartDate(sd.toISOString().split("T")[0]);
    setEndDate(ed.toISOString().split("T")[0]);
    setFilterCabang("");
    setFilterDivisi("");
    setPage(1);
  };

  const statusBadge = (agenda: Agenda) => {
    if (agenda.status_absen === "hadir" && agenda.jam_absen_keluar) {
      return <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Selesai</span>;
    }
    if (agenda.status_absen === "hadir") {
      return <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Hadir</span>;
    }
    return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Terjadwal</span>;
  };

  const formatDate = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] border border-blue-100">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Agenda</h1>
            <p className="text-sm text-slate-500">Riwayat agenda harian seluruh staf</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Dari</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCabang}
            onChange={(e) => setFilterCabang(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Cabang</option>
            {listCabang.map((c) => (
              <option key={c.id} value={c.id}>{c.nama_cabang}</option>
            ))}
          </select>
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Divisi</option>
            {listDivisi.map((d) => (
              <option key={d.id} value={d.id}>{d.nama_divisi}</option>
            ))}
          </select>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-full border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center w-10">No</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Tanggal</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Karyawan</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Cabang</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Divisi</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Judul</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Keterangan</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">Foto</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">Jam Absen</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="border border-slate-200 px-3 py-3">
                    <div className="h-3 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Calendar size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada data agenda</p>
                  <p className="text-xs text-slate-400">Coba ubah rentang tanggal atau filter</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowNum = (pagination.current_page - 1) * pagination.per_page + idx + 1;
                return (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-400">{rowNum}</td>
                    <td className="border border-slate-200 px-3 py-2.5 font-medium text-slate-700">{formatDate(item.tanggal)}</td>
                    <td className="border border-slate-200 px-3 py-2.5">
                      <div className="font-semibold text-slate-800">{item.user?.name || "-"}</div>
                      <div className="text-[9px] text-slate-400">{item.user?.jabatan || ""}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {item.user?.cabang?.length ? item.user.cabang.map((c) => (
                          <span key={c.id} className="inline-flex rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-medium text-sky-700">{c.nama_cabang}</span>
                        )) : <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{item.user?.divisi?.nama_divisi || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2.5 font-medium text-slate-700">{item.judul || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2.5 max-w-[200px]">
                      <div className="whitespace-pre-wrap break-words text-slate-500">{item.keterangan || "-"}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">
                      {item.foto ? (
                        <a
                          href={`${APP_URL}/uploads/agenda/${item.foto}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200"
                        >
                          <Image size={14} />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">
                      {item.jam_absen_masuk && (
                        <span className="text-emerald-600 font-medium">{item.jam_absen_masuk.slice(0, 5)}</span>
                      )}
                      {item.jam_absen_keluar && (
                        <span className="text-rose-600 font-medium"> - {item.jam_absen_keluar.slice(0, 5)}</span>
                      )}
                      {!item.jam_absen_masuk && <span className="text-slate-300">-</span>}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">{statusBadge(item)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pagination.last_page > 1 && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500">
          <span>
            Menampilkan {pagination.current_page}-{pagination.last_page} dari {pagination.total} data
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - pagination.current_page) <= 2 || p === 1 || p === pagination.last_page)
              .map((p, i, arr) => (
                <span key={p} className="inline-flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`min-w-[24px] rounded px-1.5 py-0.5 text-center text-xs font-medium transition ${
                      p === pagination.current_page ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
