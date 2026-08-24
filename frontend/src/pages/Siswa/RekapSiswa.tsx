import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BarChart3, Search, RotateCcw, Download, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { absensiSiswaApi, adminCabangApi, APP_URL } from "../../services/api";
import type { RekapSiswaItem } from "../../types";

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDateShort(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export default function RekapSiswaPage() {
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const [rekap, setRekap] = useState<RekapSiswaItem[]>([]);
  const [batchList, setBatchList] = useState<{ id: number; nama_batch: string; warna: string | null }[]>([]);
  const [cabangList, setCabangList] = useState<{ id: number; nama_cabang: string }[]>([]);
  const [levels, setLevels] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [filterBatch, setFilterBatch] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterCabang, setFilterCabang] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const fetchData = async (cabangOverride?: string) => {
    setLoading(true);
    try {
      const cabangVal = cabangOverride !== undefined ? cabangOverride : filterCabang;
      const params: Record<string, string | number | undefined> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (filterBatch) params.batch_id = filterBatch;
      if (filterLevel) params.level = filterLevel;
      if (cabangVal) params.cabang_id = cabangVal;
      const res = isAdminCabang ? await adminCabangApi.rekapSiswa(params) : await absensiSiswaApi.rekap(params);
      setRekap(res.data.rekap || []);
      setBatchList(res.data.batch_list || []);
      setCabangList(res.data.cabang_list || []);
      setLevels(res.data.levels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCabangChange = (val: string) => {
    setFilterCabang(val);
    setFilterBatch("");
    setFilterLevel("");
    setPage(1);
    fetchData(val);
  };

  const handleFilter = () => {
    setPage(1);
    fetchData();
  };

  const resetFilter = () => {
    setStartDate(firstDay);
    setEndDate(lastDay);
    setFilterBatch("");
    setFilterLevel("");
    setFilterCabang("");
    setPage(1);
    fetchData("");
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

  const totalPages = Math.max(1, Math.ceil(rekap.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedList = rekap.slice((safePage - 1) * perPage, safePage * perPage);

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    if (filterBatch) params.set("batch_id", filterBatch);
    if (filterLevel) params.set("level", filterLevel);
    if (filterCabang) params.set("cabang_id", filterCabang);
    window.open(`${APP_URL}/api/absensi-siswa/rekap/export-excel?${params.toString()}`, "_blank");
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    if (filterBatch) params.set("batch_id", filterBatch);
    if (filterLevel) params.set("level", filterLevel);
    if (filterCabang) params.set("cabang_id", filterCabang);
    window.open(`${APP_URL}/api/absensi-siswa/rekap/export-pdf?${params.toString()}`, "_blank");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#0E6187]" />
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Cabang</label>
              <select value={filterCabang} onChange={(e) => handleCabangChange(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]">
                <option value="">Semua Cabang</option>
                {cabangList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1">Batch</label>
              <div className="relative">
                <button
                  onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-[#0E6187]"
                >
                  {filterBatch ? (() => {
                    const b = batchList.find(x => String(x.id) === filterBatch)
                    return <>
                      {b?.warna ? <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      <span className="truncate">{b?.nama_batch || filterBatch}</span>
                    </>
                  })() : <span className="text-slate-500">Semua Batch</span>}
                  <svg className="ml-auto h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showBatchDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto min-w-[180px]">
                      <button onClick={() => { setFilterBatch(''); setShowBatchDropdown(false); setPage(1) }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${!filterBatch ? 'bg-blue-50 font-semibold' : ''}`}>
                        Semua Batch
                      </button>
                      {batchList.map(b => (
                        <button key={b.id} onClick={() => { setFilterBatch(String(b.id)); setShowBatchDropdown(false); setPage(1) }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${String(b.id) === filterBatch ? 'bg-blue-50 font-semibold' : ''}`}>
                          {b.warna ? <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                          {b.nama_batch}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]">
              <option value="">Semua</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]" />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]" />
          </div>
          <button onClick={handleFilter} className="flex items-center gap-1 px-3 py-1.5 bg-[#0E6187] text-white rounded-lg hover:bg-[#0a1629] text-sm">
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
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Lv</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Tgl Mulai Kelas</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Tgl Selesai Kelas</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Total Pertemuan</th>
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
                <tr><td colSpan={15} className="border border-slate-200 px-4 py-12 text-center text-sm text-slate-400">Memuat data...</td></tr>
              ) : rekap.length === 0 ? (
                <tr><td colSpan={15} className="border border-slate-200 px-4 py-12 text-center text-sm text-slate-400">Belum ada data rekap untuk periode ini</td></tr>              ) : pagedList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">{(safePage - 1) * perPage + idx + 1}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800">{item.nama}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{item.batch}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-600">{item.level ?? '-'}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{formatDateShort(item.kelas_tanggal_mulai)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{formatDateShort(item.kelas_tanggal_selesai)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-sm text-center text-slate-600">{item.total_pertemuan ?? '-'}</td>
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
                  <td colSpan={7} className="border border-slate-200 px-4 py-3 text-sm text-slate-800">Total</td>
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

      {/* Pagination */}
      {!loading && rekap.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Per halaman</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              {[25, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>Menampilkan {pagedList.length} dari {rekap.length} data</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-sm text-slate-300">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`min-w-[32px] rounded-md border px-2 py-1.5 text-sm font-medium transition ${
                      p === safePage
                        ? 'border-slate-200 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}>
                    {p}
                  </button>
                )
              )
            })()}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
