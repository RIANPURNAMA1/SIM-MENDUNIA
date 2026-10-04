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
      tidakAbsenPulang: acc.tidakAbsenPulang + r.tidak_absen_pulang,
      total_hadir: acc.total_hadir + r.total_hadir,
      total: acc.total + r.total,
    }),
    { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, tidakAbsenPulang: 0, total_hadir: 0, total: 0 }
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
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Rekap Absensi Siswa</h1>
            <p className="text-sm text-[#5f6368]">Rekap kehadiran siswa per batch dan level</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E6187] text-white hover:bg-[#084c63] text-sm font-medium">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5221f] text-white hover:bg-[#a50e0e] text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#dadce0] p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <label className="block text-xs font-medium text-[#5f6368] mb-1">Cabang</label>
              <select value={filterCabang} onChange={(e) => handleCabangChange(e.target.value)} className="w-full px-3 py-1.5 border border-[#dadce0] text-sm focus:border-[#1a73e8]">
                <option value="">Semua Cabang</option>
                {cabangList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama_cabang}</option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-[#5f6368] mb-1">Batch</label>
              <div className="relative">
                <button
                  onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                  className="flex w-full items-center gap-2 border border-[#dadce0] bg-white px-3 py-1.5 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
                >
                  {filterBatch ? (() => {
                    const b = batchList.find(x => String(x.id) === filterBatch)
                    return <>
                      {b?.warna ? <span className="inline-block w-3 h-3 shrink-0" style={{ backgroundColor: b.warna }} /> : null}
                      <span className="truncate">{b?.nama_batch || filterBatch}</span>
                    </>
                  })() : <span className="text-[#5f6368]">Semua Batch</span>}
                  <svg className="ml-auto h-4 w-4 shrink-0 text-[#80868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
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
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-[#5f6368] mb-1">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-1.5 border border-[#dadce0] text-sm focus:border-[#1a73e8]">
              <option value="">Semua</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-[#5f6368] mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-[#dadce0] text-sm focus:border-[#1a73e8]" />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-[#5f6368] mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-[#dadce0] text-sm focus:border-[#1a73e8]" />
          </div>
          <button onClick={handleFilter} className="btn btn-primary btn-sm">
            <Search className="w-4 h-4" /> Cari
          </button>
          <button onClick={resetFilter} className="btn btn-neutral btn-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#dadce0] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-260px)] overflow-auto">
              <table className="w-full min-w-[1900px] border-collapse text-left text-sm text-black">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center w-12">#</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368]">Nama</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368]">Batch</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">Lv</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368]">Tgl Mulai Kelas</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368]">Tgl Selesai Kelas</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">Total Pertemuan</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">HADIR</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">TERLAMBAT</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">IZIN</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">SAKIT</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">ALPA</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">TIDAK ABSEN PULANG</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">Total Hadir</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">%</th>
                    <th className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#5f6368] text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.length === 0 ? (
                    <tr><td colSpan={16} className="px-6 py-12 text-center text-sm text-[#80868b]">Belum ada data rekap untuk periode ini</td></tr>
                  ) : pagedList.map((item, idx) => {
                    const isUndur = item.status_kandidat === 'Mengundurkan Diri';
                    return (
                    <tr key={item.id} className={`${isUndur ? 'bg-[#fce8e6]' : 'bg-white'} transition hover:bg-[#f8f9fa] group`}>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">{(safePage - 1) * perPage + idx + 1}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#202124]">
                        {item.nama}
                        {isUndur && (
                          <span className="ml-2 inline-block bg-[#f6d7d5] px-1.5 py-0.5 align-middle text-[10px] font-medium text-[#a50e0e]">
                            Mengundurkan Diri
                          </span>
                        )}
                      </td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black">{item.batch}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">{item.level ?? '-'}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">{formatDateShort(item.kelas_tanggal_mulai)}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">{formatDateShort(item.kelas_tanggal_selesai)}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">{item.total_pertemuan ?? '-'}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#137333]">{item.hadir}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#b06000]">{item.terlambat}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#1967d2]">{item.izin}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#1967d2]">{item.sakit}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#a50e0e]">{item.alpa}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#7627bb]">{item.tidak_absen_pulang}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#202124]">{item.total_hadir}</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center font-medium text-[#202124]">{item.persentase}%</td>
                      <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">{item.total}</td>
                    </tr>
                  );
                  })}
                </tbody>
                {rekap.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10 bg-[#f8f9fa]">
                    <tr>
                      <td colSpan={7} className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-[#202124]">Total</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#137333]">{totals.hadir}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#b06000]">{totals.terlambat}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#1967d2]">{totals.izin}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#1967d2]">{totals.sakit}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#a50e0e]">{totals.alpa}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#7627bb]">{totals.tidakAbsenPulang}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#202124]">{totals.total_hadir}</td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#202124]">
                        {totals.total > 0 ? ((totals.total_hadir / totals.total) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="border-t border-[#e8eaed] px-3 py-3 text-xs font-medium text-center text-[#202124]">{totals.total}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && rekap.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span>Per halaman</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-[#dadce0] bg-white px-2 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8]">
              {[25, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>Menampilkan {pagedList.length} dari {rekap.length} data</span>
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
                  <span key={`dots-${i}`} className="px-1 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`min-w-[32px] border px-2 py-1.5 text-sm font-medium transition ${ p === safePage ? 'border-[#dadce0] bg-[#202124] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}>
                    {p}
                  </button>
                )
              )
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
    </div>
  );
}
