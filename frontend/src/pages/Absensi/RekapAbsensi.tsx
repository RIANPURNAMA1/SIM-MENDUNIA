import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, RotateCcw } from "lucide-react";
import { rekapAbsensiApi } from "../../services/api";
import type { RekapAbsensiItem, Divisi, Cabang } from "../../types";

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
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">
              Rekap Absensi
            </h1>
            <p className="text-sm text-[#5f6368]">
              Rekapitulasi kehadiran karyawan - {monthLabel()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">
              Dari
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">
              Sampai
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
            />
          </div>
          <select
            value={filterCabang}
            onChange={(e) => setFilterCabang(e.target.value)}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
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
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
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
            className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      {!loading && data.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.hadir}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              Hadir
            </p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.terlambat}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              Telat
            </p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.izin}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              Izin
            </p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.alpa}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              Alpa
            </p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.pulang_awal}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              P.Awal
            </p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.lembur}
            </span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">
              Lembur
            </p>
          </div>
          <div className="border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">
              {t.karyawan}
            </span>
            <p className="text-[10px] font-bold tracking-wider text-[#5f6368] uppercase">
              Karyawan
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">
                Karyawan
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">
                Cabang
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">
                Divisi
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Hadir
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Telat
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Izin
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Alpa
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                P.Awal
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Lembur
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Jam Kerja
              </th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">
                Total Jam
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={11} className="px-6 py-12 text-center"
                  >
                    <div className="h-3 w-full #e8eaed-\[#e8eaed\]" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <BarChart3 size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">
                    Tidak ada data rekap
                  </p>
                  <p className="text-xs text-[#80868b]">
                    Coba ubah rentang tanggal atau filter
                  </p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <div className="font-semibold text-[#202124]">
                      {item.nama}
                    </div>
                    <div className="text-[9px] text-[#80868b]">
                      {item.jabatan || "-"}
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">
                    {item.cabang}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">
                    {item.divisi}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#137333]">
                    {item.hadir}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#b06000]">
                    {item.terlambat}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#1a73e8]">
                    {item.izin}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#c5221f]">
                    {item.alpa}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#b06000]">
                    {item.pulang_awal}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#7627bb]">
                    {item.jumlah_lembur}x
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center text-[#5f6368]">
                    {item.total_jam_kerja}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center font-semibold text-[#202124]">
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
