import { useState, useEffect } from "react"
import { Notebook, ChevronLeft, ChevronRight, Check, Minus } from "lucide-react"
import { penilaianApi } from "../../services/api"

interface Guru {
  id: number;
  name: string;
}

interface BatchItem {
  id: number;
  nama_batch: string;
}

interface Student {
  id: number;
  nama: string;
  kelas: string | null;
  kelas_id: number | null;
  kelas_relasi?: { nama_kelas: string } | null;
}

interface ComponentItem {
  id: number;
  nama: string;
}

interface Pertemuan {
  tanggal: string;
  hari: string;
  pertemuan_ke: number;
  scores: (number | null)[];
}

interface CatSummary {
  averages: Record<string, number | null>;
  improvements: Record<string, number | null>;
  nilai_akhir: number | null;
  resiko: string | null;
  resiko_class: string | null;
}

interface Category {
  nama_kategori: string;
  components: ComponentItem[];
  pertemuan: Pertemuan[];
  summary: CatSummary;
}

const RESIKO_STYLE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
};

const SCORE_BADGE = (s: number | null): string => {
  if (s === null) return "bg-gray-100 text-gray-400";
  if (s >= 90) return "bg-emerald-100 text-emerald-700";
  if (s >= 75) return "bg-blue-100 text-blue-700";
  if (s >= 60) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
};

const DAYS_IND = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

function dayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_IND[d.getDay() === 0 ? 6 : d.getDay() - 1] || "";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PenilaianPage() {
  const [levels, setLevels] = useState<string[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [batchList, setBatchList] = useState<BatchItem[]>([]);

  const [filterLevel, setFilterLevel] = useState("");
  const [filterGuru, setFilterGuru] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  const [kelas, setKelas] = useState<{
    id: number; nama_kelas: string; level: string; batch_nama: string;
    tanggal_mulai: string; tanggal_selesai: string;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [assessmentCheck, setAssessmentCheck] = useState<Record<string, boolean>>({});
  const [weekStart, setWeekStart] = useState("");
  const [prevWeek, setPrevWeek] = useState("");
  const [nextWeek, setNextWeek] = useState("");

  const [loading, setLoading] = useState(false);

  const [modalData, setModalData] = useState<{
    siswa: string; level: string; total_pertemuan: number; categories: Category[];
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchMatrix = async (overrideParams?: Record<string, string>) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (overrideParams) {
        Object.assign(params, overrideParams);
      } else {
        if (filterLevel) params.level = filterLevel;
        if (filterGuru) params.guru_id = filterGuru;
        if (filterBatch) params.batch_id = filterBatch;
        if (weekStart) params.week = weekStart;
      }
      const res = await penilaianApi.matrix(params);
      const d = res.data;
      setLevels(d.levels || []);
      setGurus(d.gurus || []);
      setBatchList(d.batch_list || []);
      setKelas(d.kelas || null);
      setStudents(d.students || []);
      setCategories(d.categories || []);
      setDays(d.days || []);
      setAssessmentCheck(d.assessment_check || {});
      setWeekStart(d.week_start || "");
      setPrevWeek(d.prev_week || "");
      setNextWeek(d.next_week || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix({});
  }, []);

  const handleLevelChange = (val: string) => {
    setFilterLevel(val);
    setFilterGuru("");
    setFilterBatch("");
    setBatchList([]);
    setKelas(null);
    setStudents([]);
    setDays([]);
    if (val) {
      fetchMatrix({ level: val });
    } else {
      fetchMatrix({});
    }
  };

  const handleGuruChange = (val: string) => {
    setFilterGuru(val);
    setFilterBatch("");
    setKelas(null);
    setStudents([]);
    setDays([]);
    if (val && filterLevel) {
      fetchMatrix({ level: filterLevel, guru_id: val });
    } else if (filterLevel) {
      fetchMatrix({ level: filterLevel });
    } else {
      fetchMatrix({});
    }
  };

  const handleBatchChange = (val: string) => {
    setFilterBatch(val);
    setKelas(null);
    setStudents([]);
    setDays([]);
    const params: Record<string, string> = {};
    if (filterLevel) params.level = filterLevel;
    if (filterGuru) params.guru_id = filterGuru;
    if (val) params.batch_id = val;
    fetchMatrix(params);
  };

  const navigateWeek = (target: string) => {
    const params: Record<string, string> = { week: target };
    if (filterLevel) params.level = filterLevel;
    if (filterGuru) params.guru_id = filterGuru;
    if (filterBatch) params.batch_id = filterBatch;
    fetchMatrix(params);
  };

  const openDetailModal = async (siswaId: number, namaSiswa: string) => {
    if (!kelas) return;
    setModalLoading(true);
    setShowModal(true);
    setModalData(null);
    try {
      const params: Record<string, string | number | undefined> = {
        siswa_id: siswaId,
        batch_id: kelas.batch_id,
        level: kelas.level,
        guru_id: kelas.user_id,
        kelas_sensei_id: kelas.id,
      };
      const res = await penilaianApi.dayDetail(params);
      setModalData(res.data);
    } catch {
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  const getResikoBadge = (avg: number | null): string => {
    if (avg === null) return "";
    if (avg >= 85) return "Sangat Siap";
    if (avg >= 75) return "Siap";
    if (avg >= 65) return "Perlu Pendampingan";
    return "Berisiko";
  };

  const getResikoClass = (avg: number | null): string => {
    if (avg === null) return "bg-gray-100 text-gray-500";
    if (avg >= 75) return "bg-emerald-100 text-emerald-700";
    if (avg >= 65) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <Notebook size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Rekap Penilaian Siswa</h1>
            <p className="text-sm text-slate-500">Pantau perkembangan dan nilai siswa per pertemuan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-md px-3 py-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Terisi</span>
          <Minus className="w-3.5 h-3.5 text-slate-300" />
          <span>Kosong</span>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Level</label>
            <select value={filterLevel} onChange={(e) => handleLevelChange(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Semua Level</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Guru</label>
            <select value={filterGuru} onChange={(e) => handleGuruChange(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Semua Guru</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Batch</label>
            <select value={filterBatch} onChange={(e) => handleBatchChange(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Pilih Batch</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">&nbsp;</label>
            <button onClick={() => {
              setFilterLevel(""); setFilterGuru(""); setFilterBatch("");
              setBatchList([]); setKelas(null); setStudents([]); setDays([]);
              fetchMatrix({});
            }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200">
              Reset
            </button>
          </div>
        </div>
      </div>

      {kelas && categories.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h6 className="text-sm font-semibold text-slate-700">
              {days.length > 0 ? `${formatDate(days[0])} - ${formatDate(days[days.length - 1])} ${new Date(days[0] + "T00:00:00").getFullYear()}` : ""}
            </h6>
            <div className="flex items-center gap-1">
              <button onClick={() => navigateWeek(prevWeek)}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateWeek(nextWeek)}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
                <thead className="text-sm text-slate-600">
                  <tr>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium sticky left-0 bg-white min-w-[140px] z-10" style={{ boxShadow: "2px 0 4px rgba(0,0,0,0.02)" }}>
                      Nama Siswa
                    </th>
                    <th scope="col" className="border border-slate-200 px-4 py-3 font-medium min-w-[100px]">Kelas</th>
                    {days.map((d) => (
                      <th key={d} scope="col" className="border border-slate-200 px-4 py-3 text-center min-w-[70px]">
                        <span className="text-xs text-slate-600">{dayName(d)}</span>
                        <span className="block text-[10px] text-slate-400">{formatDate(d)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2 + days.length} className="border border-slate-200 px-6 py-8 text-center text-sm text-slate-400">Memuat data...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={2 + days.length} className="border border-slate-200 px-6 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Notebook size={24} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada siswa aktif di batch ini.</p>
                    </td></tr>
                  ) : students.map((s) => (
                    <tr key={s.id} className="bg-white transition hover:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 sticky left-0 bg-white z-[1]" style={{ boxShadow: "2px 0 4px rgba(0,0,0,0.02)" }}>
                        {s.nama}
                      </td>
                      <td className="border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
                        {kelas?.nama_kelas || s.kelas_relasi?.nama_kelas || s.kelas || "-"}
                        {kelas && (
                          <span className="block text-[10px] text-slate-400">
                            Level {kelas.level} - {kelas.tanggal_mulai && new Date(kelas.tanggal_mulai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s/d {kelas.tanggal_selesai && new Date(kelas.tanggal_selesai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </td>
                      {days.map((d) => {
                        const key = `${s.id}_${d}`;
                        const hasAssessment = assessmentCheck[key];
                        return (
                          <td key={d} className="border border-slate-200 px-4 py-2.5 text-center">
                            {hasAssessment ? (
                              <button
                                onClick={() => openDetailModal(s.id, s.nama)}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
                                title="Lihat detail"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {kelas && categories.length === 0 && !loading && (
        <div className="text-center text-slate-400 py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Notebook size={24} />
          </div>
          <p className="mt-3 text-sm text-slate-500">Belum ada kategori penilaian untuk level ini.</p>
        </div>
      )}

      {!kelas && !loading && (
        <div className="text-center text-slate-400 py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Notebook size={24} />
          </div>
          <p className="mt-3 text-sm text-slate-500">Pilih Level, Guru, dan Kelas untuk melihat rekap penilaian.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="flex w-full max-w-7xl flex-col rounded-xl bg-white shadow-xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{modalData?.siswa || "Memuat..."}</h2>
                <span className="text-xs text-slate-400">{modalData ? `${modalData.total_pertemuan} pertemuan` : ""}</span>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {modalLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">Memuat data penilaian...</div>
              ) : !modalData ? (
                <div className="py-8 text-center text-sm text-rose-500">Gagal memuat data penilaian.</div>
              ) : modalData.categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Belum ada data penilaian untuk siswa ini.</div>
              ) : (
                <div className="space-y-6">
                  {modalData.categories.map((cat, ci) => {
                    if (!cat.summary || cat.summary.nilai_akhir === null) return null;
                    const isRekapAkhir = modalData.level === "2" || modalData.level === "3" || modalData.level === "4";
                    const nComp = cat.components.length;
                    const teoriIndices: number[] = [];
                    const praktekIndices: number[] = [];
                    for (let idx = 0; idx < nComp; idx++) {
                      if (idx < nComp - 2) teoriIndices.push(idx);
                      else praktekIndices.push(idx);
                    }

                    return (
                      <div key={ci}>
                        <h6 className="mb-2 text-sm font-semibold text-slate-800">{cat.nama_kategori}</h6>

                        {isRekapAkhir ? (
                          <>
                            <div className="overflow-x-auto mb-2">
                              <table className="w-full text-xs border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                <thead>
                                  <tr className="bg-amber-700 text-white">
                                    <th colSpan={nComp + 4} className="px-2 py-1.5 text-center font-semibold">TOTAL NILAI</th>
                                  </tr>
                                  <tr className="bg-amber-700 text-white">
                                    {cat.components.map((comp, j) => (
                                      <th key={comp.id} className="px-2 py-1.5 text-center font-medium">
                                        {comp.nama === "Simulasi" && cat.pertemuan.length > 0
                                          ? `Simulasi ${Math.ceil(cat.pertemuan[cat.pertemuan.length - 1].pertemuan_ke / 5)}`
                                          : comp.nama}
                                      </th>
                                    ))}
                                    <th className="px-2 py-1.5 text-center font-medium min-w-[70px]">NILAI TEORI</th>
                                    <th className="px-2 py-1.5 text-center font-medium min-w-[80px]">NILAI PRAKTEK</th>
                                    <th className="px-2 py-1.5 text-center font-medium min-w-[90px]">NILAI RATA-RATA</th>
                                    <th className="px-2 py-1.5 text-center font-medium min-w-[70px]">RESIKO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-white">
                                    {(() => {
                                      const lastPt = cat.pertemuan.length > 0 ? cat.pertemuan[cat.pertemuan.length - 1] : null;
                                      const scores = lastPt?.scores || [];
                                      let totalTeori = 0, countTeori = 0, totalPraktek = 0, countPraktek = 0;
                                      scores.forEach((s, j) => {
                                        if (s !== null) {
                                          if (teoriIndices.includes(j)) { totalTeori += s; countTeori++; }
                                          if (praktekIndices.includes(j)) { totalPraktek += s; countPraktek++; }
                                        }
                                      });
                                      const rataRata = scores.filter(s => s !== null).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) / (scores.filter(s => s !== null).length || 1);
                                      return (
                                        <>
                                          {cat.components.map((comp, j) => {
                                            const s = j < scores.length ? scores[j] : null;
                                            return (
                                              <td key={comp.id} className="px-2 py-1.5 text-center">
                                                {s !== null ? (
                                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                                    {Math.round(s)}
                                                  </span>
                                                ) : <span className="text-slate-300">-</span>}
                                              </td>
                                            );
                                          })}
                                          <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                                            {countTeori > 0 ? totalTeori.toFixed(1) : "-"}
                                          </td>
                                          <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                                            {countPraktek > 0 ? totalPraktek.toFixed(1) : "-"}
                                          </td>
                                          <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                                            {rataRata > 0 ? rataRata.toFixed(1) : "-"}
                                          </td>
                                          <td className="px-2 py-1.5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getResikoClass(rataRata)}`}>
                                              {getResikoBadge(rataRata)}
                                            </span>
                                          </td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <details className="mt-2 text-xs text-slate-500">
                              <summary className="cursor-pointer hover:text-slate-700">Detail per pertemuan</summary>
                              <div className="overflow-x-auto mt-1">
                                <table className="w-full text-[11px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                  <thead>
                                    <tr className="bg-amber-700 text-white">
                                      <th className="px-2 py-1 text-left">Tanggal</th>
                                      {cat.components.map((comp) => (
                                        <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                                      ))}
                                      <th className="px-2 py-1 text-center">Rata-Rata</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cat.pertemuan.map((pt, pi) => {
                                      const scores = pt.scores.filter(s => s !== null);
                                      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                                      return (
                                        <tr key={pi} className="border-b border-slate-100">
                                          <td className="px-2 py-1 text-slate-600">{pt.hari}, {pt.tanggal}</td>
                                          {pt.scores.map((s, j) => (
                                            <td key={j} className="px-2 py-1 text-center">
                                              {s !== null ? (
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                                  {Math.round(s)}
                                                </span>
                                              ) : <span className="text-slate-300">-</span>}
                                            </td>
                                          ))}
                                          <td className="px-2 py-1 text-center font-semibold text-slate-700">
                                            {avg !== null ? avg.toFixed(1) : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          </>
                        ) : (
                          <>
                            <div className="overflow-x-auto mb-2">
                              <table className="w-full text-xs border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                <thead>
                                  <tr className="bg-amber-700 text-white">
                                    <th rowSpan={2} className="px-2 py-1.5 text-left font-semibold">No</th>
                                    <th rowSpan={2} className="px-2 py-1.5 text-left font-semibold">Nama Siswa</th>
                                    <th colSpan={cat.components.length} className="px-2 py-1.5 text-center font-semibold">Nilai Rata-Rata</th>
                                    <th colSpan={cat.components.length} className="px-2 py-1.5 text-center font-semibold">Peningkatan</th>
                                    <th rowSpan={2} className="px-2 py-1.5 text-center font-semibold">Nilai Akhir</th>
                                    <th rowSpan={2} className="px-2 py-1.5 text-center font-semibold">Resiko</th>
                                  </tr>
                                  <tr className="bg-amber-700 text-white">
                                    {cat.components.map((comp) => (
                                      <th key={comp.id} className="px-2 py-1 text-center font-medium text-[11px]">{comp.nama}</th>
                                    ))}
                                    {cat.components.map((comp) => (
                                      <th key={comp.id} className="px-2 py-1 text-center font-medium text-[11px]">{comp.nama}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-white">
                                    <td className="px-2 py-1.5 text-slate-600">1</td>
                                    <td className="px-2 py-1.5 font-medium text-slate-800">{modalData.siswa}</td>
                                    {cat.components.map((comp) => {
                                      const avg = cat.summary.averages[comp.id];
                                      return (
                                        <td key={comp.id} className="px-2 py-1.5 text-center text-slate-700">
                                          {avg !== null ? avg.toFixed(1) : "-"}
                                        </td>
                                      );
                                    })}
                                    {cat.components.map((comp) => {
                                      const imp = cat.summary.improvements[comp.id];
                                      return (
                                        <td key={comp.id} className={`px-2 py-1.5 text-center ${imp !== null ? (imp < 0 ? "text-rose-600" : imp > 0 ? "text-emerald-600" : "") : ""}`}>
                                          {imp !== null ? `${imp > 0 ? "+" : ""}${imp.toFixed(1)}` : "-"}
                                        </td>
                                      );
                                    })}
                                    <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                                      {cat.summary.nilai_akhir?.toFixed(1) || "-"}
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${RESIKO_STYLE[cat.summary.resiko_class || ""] || "bg-gray-100 text-gray-500"}`}>
                                        {cat.summary.resiko || "-"}
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <details className="mt-2 text-xs text-slate-500">
                              <summary className="cursor-pointer hover:text-slate-700">Detail per pertemuan</summary>
                              <div className="overflow-x-auto mt-1">
                                <table className="w-full text-[11px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                  <thead>
                                    <tr className="bg-amber-700 text-white">
                                      <th className="px-2 py-1 text-left">Tanggal</th>
                                      {cat.components.map((comp) => (
                                        <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                                      ))}
                                      <th className="px-2 py-1 text-center">Rata-Rata</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cat.pertemuan.map((pt, pi) => {
                                      const scores = pt.scores.filter(s => s !== null);
                                      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                                      return (
                                        <tr key={pi} className="border-b border-slate-100">
                                          <td className="px-2 py-1 text-slate-600">{pt.hari}, {pt.tanggal}</td>
                                          {pt.scores.map((s, j) => (
                                            <td key={j} className="px-2 py-1 text-center">
                                              {s !== null ? (
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                                  {Math.round(s)}
                                                </span>
                                              ) : <span className="text-slate-300">-</span>}
                                            </td>
                                          ))}
                                          <td className="px-2 py-1 text-center font-semibold text-slate-700">
                                            {avg !== null ? avg.toFixed(1) : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
