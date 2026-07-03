import { useState, useEffect } from "react";
import { BarChart3, Search, RotateCcw, Download } from "lucide-react";
import { absensiSiswaApi } from "../services/api";
import type { RekapSiswaItem } from "../types";

export default function RekapSiswaPage() {
  const [rekap, setRekap] = useState<RekapSiswaItem[]>([]);
  const [batchList, setBatchList] = useState<{ id: number; nama_batch: string }[]>([]);
  const [levels] = useState([1, 2, 3, 4]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (filterBatch) params.batch_id = filterBatch;
      if (filterLevel) params.level = filterLevel;
      const res = await absensiSiswaApi.rekap(params);
      setRekap(res.data.rekap || []);
      setBatchList(res.data.batch_list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const resetFilter = () => {
    setStartDate(firstDay);
    setEndDate(lastDay);
    setFilterBatch("");
    setFilterLevel("");
  };

  const totals = rekap.reduce(
    (acc, r) => ({
      hadir: acc.hadir + r.hadir,
      terlambat: acc.terlambat + r.terlambat,
      izin: acc.izin + r.izin,
      sakit: acc.sakit + r.sakit,
      alpa: acc.alpa + r.alpa,
      total_hadir: acc.total_hadir + r.total_hadir,
      total: acc.total + r.total,
    }),
    { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total_hadir: 0, total: 0 }
  );

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    if (filterBatch) params.set("batch_id", filterBatch);
    if (filterLevel) params.set("level", filterLevel);
    window.open(`http://localhost:8000/absensi-siswa/rekap/export-excel?${params.toString()}`, "_blank");
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    if (filterBatch) params.set("batch_id", filterBatch);
    if (filterLevel) params.set("level", filterLevel);
    window.open(`http://localhost:8000/absensi-siswa/rekap/export-pdf?${params.toString()}`, "_blank");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#0D1F3C]" />
          <h1 className="text-xl font-bold text-gray-800">Rekap Absensi Siswa</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1">Batch</label>
              <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D1F3C]">
              <option value="">Semua Batch</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_batch}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D1F3C]">
              <option value="">Semua</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D1F3C]" />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D1F3C]" />
          </div>
          <button onClick={handleFilter} className="flex items-center gap-1 px-3 py-1.5 bg-[#0D1F3C] text-white rounded-lg hover:bg-[#0a1629] text-sm">
            <Search className="w-4 h-4" /> Cari
          </button>
          <button onClick={resetFilter} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium w-10">#</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Nama</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Batch</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-emerald-700">HADIR</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-amber-700">TERLAMBAT</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-blue-700">IZIN</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-sky-700">SAKIT</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-rose-700">ALPA</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-slate-700">Total Hadir</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-slate-700">%</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="border border-slate-200 px-4 py-12 text-center text-sm text-slate-400">Memuat data...</td></tr>
              ) : rekap.length === 0 ? (
                <tr><td colSpan={11} className="border border-slate-200 px-4 py-12 text-center text-sm text-slate-400">Belum ada data rekap untuk periode ini</td></tr>
              ) : rekap.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800">{item.nama}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{item.batch}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-medium text-emerald-700">{item.hadir}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-medium text-amber-700">{item.terlambat}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-medium text-blue-700">{item.izin}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-medium text-sky-700">{item.sakit}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-medium text-rose-700">{item.alpa}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-semibold text-slate-800">{item.total_hadir}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center font-semibold text-slate-800">{item.persentase}%</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-600">{item.total}</td>
                </tr>
              ))}
            </tbody>
            {rekap.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={3} className="border border-slate-200 px-4 py-3 text-sm text-slate-800">Total</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-emerald-700">{totals.hadir}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-amber-700">{totals.terlambat}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-blue-700">{totals.izin}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-sky-700">{totals.sakit}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-rose-700">{totals.alpa}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-800">{totals.total_hadir}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-800">
                    {totals.total > 0 ? ((totals.total_hadir / totals.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-800">{totals.total}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
