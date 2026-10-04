import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Notebook, Check, Minus } from "lucide-react"
import { penilaianApi, adminCabangApi } from "../../services/api"

interface Guru {
  id: number;
  name: string;
}

interface BatchItem {
  id: number;
  nama_batch: string;
}

interface CabangItem {
  id: number;
  nama_cabang: string;
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

const SCORE_BADGE = (s: number | null): string => {
  if (s === null) return "bg-[#f1f3f4] text-[#80868b]";
  if (s >= 90) return "bg-[#ceead6] text-[#137333]";
  if (s >= 75) return "bg-[#e8f0fe] text-[#1967d2]";
  if (s >= 60) return "bg-[#fef7e0] text-[#b06000]";
  return "bg-[#f6d7d5] text-[#a50e0e]";
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
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const [levels, setLevels] = useState<string[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [batchList, setBatchList] = useState<BatchItem[]>([]);
  const [cabangs, setCabangs] = useState<CabangItem[]>([]);

  const [filterCabang, setFilterCabang] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterGuru, setFilterGuru] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const [kelas, setKelas] = useState<{
    id: number; nama_kelas: string; level: string; batch_nama: string;
    tanggal_mulai: string; tanggal_selesai: string;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [assessmentCheck, setAssessmentCheck] = useState<Record<string, boolean>>({});

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
        if (filterCabang) params.cabang_id = filterCabang;
        if (filterBatch) params.batch_id = filterBatch;
        if (filterGuru) params.guru_id = filterGuru;
        if (filterLevel) params.level = filterLevel;
      }
      const res = isAdminCabang ? await adminCabangApi.penilaian(params) : await penilaianApi.matrix(params);
      const d = res.data;
      setLevels(d.levels || []);
      setGurus(d.gurus || []);
      setBatchList(d.batch_list || []);
      setCabangs(d.cabangs || []);
      setKelas(d.kelas || null);
      setStudents(d.students || []);
      setCategories(d.categories || []);
      setDays(d.days || []);
      setAssessmentCheck(d.assessment_check || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix({});
  }, []);

  const resetResult = () => {
    setKelas(null);
    setStudents([]);
    setDays([]);
  };

  const handleCabangChange = (val: string) => {
    setFilterCabang(val);
    setFilterBatch("");
    setFilterGuru("");
    setFilterLevel("");
    setBatchList([]);
    resetResult();
    if (val) {
      fetchMatrix({ cabang_id: val });
    } else {
      fetchMatrix({});
    }
  };

  const handleBatchChange = (val: string) => {
    setFilterBatch(val);
    setFilterGuru("");
    setFilterLevel("");
    resetResult();
    const params: Record<string, string> = {};
    if (filterCabang) params.cabang_id = filterCabang;
    if (val) params.batch_id = val;
    fetchMatrix(params);
  };

  const handleGuruChange = (val: string) => {
    setFilterGuru(val);
    setFilterLevel("");
    resetResult();
    const params: Record<string, string> = {};
    if (filterCabang) params.cabang_id = filterCabang;
    if (filterBatch) params.batch_id = filterBatch;
    if (val) params.guru_id = val;
    fetchMatrix(params);
  };

  const handleLevelChange = (val: string) => {
    setFilterLevel(val);
    resetResult();
    const params: Record<string, string> = {};
    if (filterCabang) params.cabang_id = filterCabang;
    if (filterBatch) params.batch_id = filterBatch;
    if (filterGuru) params.guru_id = filterGuru;
    if (val) params.level = val;
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

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Notebook size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Rekap Penilaian Siswa</h1>
            <p className="text-sm text-[#5f6368]">Pantau perkembangan dan nilai siswa per pertemuan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#80868b] bg-[#f8f9fa] px-3 py-1.5">
          <Check className="w-3.5 h-3.5 text-[#188038]" />
          <span>Terisi</span>
          <Minus className="w-3.5 h-3.5 text-[#9aa0a6]" />
          <span>Kosong</span>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f6368] mb-1">Cabang</label>
            <select value={filterCabang} onChange={(e) => handleCabangChange(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
              <option value="">Pilih Cabang</option>
              {cabangs.map((c) => (
                <option key={c.id} value={c.id}>{c.nama_cabang}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f6368] mb-1">Batch</label>
            <select value={filterBatch} onChange={(e) => handleBatchChange(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
              <option value="">Pilih Batch</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f6368] mb-1">Sensei</label>
            <select value={filterGuru} onChange={(e) => handleGuruChange(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
              <option value="">Pilih Sensei</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f6368] mb-1">Level</label>
            <select value={filterLevel} onChange={(e) => handleLevelChange(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
              <option value="">Pilih Level</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f6368] mb-1">&nbsp;</label>
            <button onClick={() => {
              setFilterCabang(""); setFilterBatch(""); setFilterGuru(""); setFilterLevel("");
              setBatchList([]); setKelas(null); setStudents([]); setDays([]);
              fetchMatrix({});
            }}
              className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] focus:outline-none focus:border-[#1a73e8]">
              Reset
            </button>
          </div>
        </div>
      </div>

      {kelas && categories.length > 0 && (
        <>
          <div className="mb-3">
            <h6 className="text-sm font-semibold text-[#3c4043]">
              {days.length > 0 ? `${formatDate(days[0])} - ${formatDate(days[days.length - 1])} ${new Date(days[0] + "T00:00:00").getFullYear()}` : ""}
            </h6>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-[#dadce0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
                <thead className="text-sm text-[#5f6368]">
                  <tr>
                    <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 sticky left-0 bg-white min-w-[140px] z-10" style={{ boxShadow: "2px 0 4px rgba(0,0,0,0.02)" }}>
                      Nama Siswa
                    </th>
                    <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 min-w-[100px]">Kelas</th>
                    {days.map((d) => (
                      <th key={d} scope="col" className="border border-[#dadce0] px-4 py-3 text-center min-w-[70px]">
                        <span className="text-xs text-[#5f6368]">{dayName(d)}</span>
                        <span className="block text-[10px] text-[#80868b]">{formatDate(d)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2 + days.length} className="border border-[#dadce0] px-6 py-8 text-center text-sm text-[#80868b]">Memuat data...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={2 + days.length} className="border border-[#dadce0] px-6 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                        <Notebook size={24} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada siswa aktif di batch ini.</p>
                    </td></tr>
                  ) : students.map((s) => (
                    <tr key={s.id} className="bg-white transition hover:bg-[#f8f9fa]">
                      <td className="border-b border-[#e8eaed] px-4 py-2.5 text-sm font-medium text-[#202124] sticky left-0 bg-white z-[1]" style={{ boxShadow: "2px 0 4px rgba(0,0,0,0.02)" }}>
                        {s.nama}
                      </td>
                      <td className="border-b border-[#e8eaed] px-4 py-2.5 text-sm text-[#5f6368]">
                        {kelas?.nama_kelas || s.kelas_relasi?.nama_kelas || s.kelas || "-"}
                        {kelas && (
                          <span className="block text-[10px] text-[#80868b]">
                            Level {kelas.level} - {kelas.tanggal_mulai && new Date(kelas.tanggal_mulai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s/d {kelas.tanggal_selesai && new Date(kelas.tanggal_selesai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </td>
                      {days.map((d) => {
                        const key = `${s.id}_${d}`;
                        const hasAssessment = assessmentCheck[key];
                        return (
                          <td key={d} className="border border-[#dadce0] px-4 py-2.5 text-center">
                            {hasAssessment ? (
                              <button
                                onClick={() => openDetailModal(s.id, s.nama)}
                                className="inline-flex items-center justify-center h-7 w-7 bg-[#0E6187] text-white transition hover:bg-[#084c63]"
                                title="Lihat detail"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-sm text-[#9aa0a6]">-</span>
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
        <div className="text-center text-[#80868b] py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
            <Notebook size={24} />
          </div>
          <p className="mt-3 text-sm text-[#5f6368]">Belum ada kategori penilaian untuk level ini.</p>
        </div>
      )}

      {!kelas && !loading && (
        <div className="text-center text-[#80868b] py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
            <Notebook size={24} />
          </div>
          <p className="mt-3 text-sm text-[#5f6368]">Pilih Cabang, Batch, Sensei, dan Level untuk melihat rekap penilaian.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center #202124-\[#202124\] p-4" onClick={closeModal}>
          <div className="border border-[#dadce0] flex w-full max-w-7xl flex-col bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#202124]">{modalData?.siswa || "Memuat..."}</h2>
                <span className="text-xs text-[#80868b]">{modalData ? `${modalData.total_pertemuan} pertemuan` : ""}</span>
              </div>
              <button onClick={closeModal} className="p-1.5 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              {modalLoading ? (
                <div className="py-8 text-center text-sm text-[#80868b]">Memuat data penilaian...</div>
              ) : !modalData ? (
                <div className="py-8 text-center text-sm text-[#d93025]">Gagal memuat data penilaian.</div>
              ) : modalData.categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#80868b]">Belum ada data penilaian untuk siswa ini.</div>
              ) : (
                <div className="space-y-6">
                  {modalData.categories.map((cat, ci) => {
                    if (!cat.summary || cat.summary.nilai_akhir === null) return null;
                    const isRekapAkhir = modalData.level === "2" || modalData.level === "3" || modalData.level === "4";

                    return (
                      <div key={ci}>
                        <h6 className="mb-2 text-sm font-semibold text-[#202124]">{cat.nama_kategori}</h6>

                        {isRekapAkhir ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px] border-collapse border border-[#dadce0] [&_th]:border [&_th]:border-[#dadce0] [&_td]:border [&_td]:border-[#dadce0]">
                              <thead>
                                <tr className="bg-[#b06000] text-white">
                                  <th className="text-xs font-medium text-[#5f6368] px-2 py-1 text-left">Tanggal</th>
                                  {cat.components.map((comp) => (
                                    <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                                  ))}
                                  <th className="text-xs font-medium text-[#5f6368] px-2 py-1 text-center">Rata-Rata</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.pertemuan.map((pt, pi) => {
                                  const scores = pt.scores.filter(s => s !== null);
                                  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                                  return (
                                    <tr key={pi} className="border-b border-[#e8eaed]">
                                      <td className="px-2 py-1 text-[#5f6368]">{pt.hari}, {pt.tanggal}</td>
                                      {pt.scores.map((s, j) => (
                                        <td key={j} className="px-2 py-1 text-center">
                                          {s !== null ? (
                                            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                              {Math.round(s)}
                                            </span>
                                          ) : <span className="text-[#9aa0a6]">-</span>}
                                        </td>
                                      ))}
                                      <td className="px-2 py-1 text-center font-semibold text-[#3c4043]">
                                        {avg !== null ? avg.toFixed(1) : "-"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px] border-collapse border border-[#dadce0] [&_th]:border [&_th]:border-[#dadce0] [&_td]:border [&_td]:border-[#dadce0]">
                              <thead>
                                <tr className="bg-[#b06000] text-white">
                                  <th className="text-xs font-medium text-[#5f6368] px-2 py-1 text-left">Tanggal</th>
                                  {cat.components.map((comp) => (
                                    <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                                  ))}
                                  <th className="text-xs font-medium text-[#5f6368] px-2 py-1 text-center">Rata-Rata</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.pertemuan.map((pt, pi) => {
                                  const scores = pt.scores.filter(s => s !== null);
                                  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                                  return (
                                    <tr key={pi} className="border-b border-[#e8eaed]">
                                      <td className="px-2 py-1 text-[#5f6368] whitespace-nowrap">{pt.hari}, {pt.tanggal}</td>
                                      {pt.scores.map((s, j) => (
                                        <td key={j} className="px-2 py-1 text-center">
                                          {s !== null ? (
                                            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                              {Math.round(s)}
                                            </span>
                                          ) : <span className="text-[#9aa0a6]">-</span>}
                                        </td>
                                      ))}
                                      <td className="px-2 py-1 text-center font-semibold text-[#3c4043]">
                                        {avg !== null ? avg.toFixed(1) : "-"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-[#dadce0] px-6 py-4">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-[#5f6368] transition hover:bg-[#f1f3f4]">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
