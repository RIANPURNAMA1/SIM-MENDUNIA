import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, RotateCcw } from "lucide-react";
import { rekapAbsensiApi } from "../services/api";
import type { RekapAbsensiItem, Divisi, Cabang } from "../types";

const MONTHS_IND = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function RekapAbsensiPage() {
  const [data, setData] = useState<RekapAbsensiItem[]>([]);
  const [listCabang, setListCabang] = useState<Cabang[]>([]);
  const [listDivisi, setListDivisi] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (filterCabang) params.cabang_id = filterCabang;
      if (filterDivisi) params.divisi_id = filterDivisi;
      const res = await rekapAbsensiApi.get(params);
      setData(res.data.data || []);
      setListCabang(res.data.list_cabang || []);
      setListDivisi(res.data.list_divisi || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterCabang, filterDivisi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilter = () => {
    const d = new Date();
    const sd = new Date(d.getFullYear(), d.getMonth(), 1);
    const ed = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setStartDate(sd.toISOString().split("T")[0]);
    setEndDate(ed.toISOString().split("T")[0]);
    setFilterCabang("");
    setFilterDivisi("");
  };

  const monthLabel = () => {
    const m = startDate
      ? new Date(startDate + "T00:00:00").getMonth()
      : now.getMonth();
    const y = startDate
      ? new Date(startDate + "T00:00:00").getFullYear()
      : now.getFullYear();
    return `${MONTHS_IND[m]} ${y}`;
  };

  const totals = () => {
    const t = {
      karyawan: data.length,
      hadir: 0,
      terlambat: 0,
      izin: 0,
      alpa: 0,
      pulang_awal: 0,
      lembur: 0,
    };
    data.forEach((d) => {
      t.hadir += d.hadir;
      t.terlambat += d.terlambat;
      t.izin += d.izin;
      t.alpa += d.alpa;
      t.pulang_awal += d.pulang_awal;
      t.lembur += d.jumlah_lembur;
    });
    return t;
  };

  const t = totals();

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Rekap Absensi
            </h1>
            <p className="text-sm text-slate-500">
              Rekapitulasi kehadiran karyawan - {monthLabel()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              Dari
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              Sampai
            </span>
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
              <option key={c.id} value={c.id}>
                {c.nama_cabang}
              </option>
            ))}
          </select>
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Divisi</option>
            {listDivisi.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama_divisi}
              </option>
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
      
      {/* Summary Cards */}
      {!loading && data.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.hadir}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Hadir
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.terlambat}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Telat
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.izin}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Izin
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.alpa}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Alpa
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.pulang_awal}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              P.Awal
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-800">
              {t.lembur}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Lembur
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center shadow-sm">
            <span className="block text-lg font-bold text-slate-900">
              {t.karyawan}
            </span>
            <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              Karyawan
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-full border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">
                Karyawan
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">
                Cabang
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">
                Divisi
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Hadir
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Telat
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Izin
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Alpa
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                P.Awal
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Lembur
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Jam Kerja
              </th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">
                Total Jam
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td
                    colSpan={11}
                    className="border border-slate-200 px-3 py-3"
                  >
                    <div className="h-3 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border border-slate-200 px-4 py-10 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <BarChart3 size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Tidak ada data rekap
                  </p>
                  <p className="text-xs text-slate-400">
                    Coba ubah rentang tanggal atau filter
                  </p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2.5">
                    <div className="font-semibold text-slate-800">
                      {item.nama}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {item.jabatan || "-"}
                    </div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">
                    {item.cabang}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">
                    {item.divisi}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-emerald-600">
                    {item.hadir}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-amber-600">
                    {item.terlambat}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-blue-600">
                    {item.izin}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-rose-600">
                    {item.alpa}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-orange-600">
                    {item.pulang_awal}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-purple-600">
                    {item.jumlah_lembur}x
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-600">
                    {item.total_jam_kerja}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-slate-800">
                    {item.grand_total_jam}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
