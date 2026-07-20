import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import {
  FileText,
  CheckCircle,
  Loader,
  Building2,
  Upload,
  CreditCard,
} from "lucide-react";

interface BayarData {
  no_invoice: string;
  pendaftar: {
    id: number;
    nama: string;
    email: string;
    telepon: string;
    created_at: string;
    status_pendaftaran: string;
    status_pembayaran: string;
  };
  product: { id: number; nama: string; harga: number } | null;
  keuangan: {
    harga_produk: number;
    diskon: number;
    total_tagihan: number;
    total_dibayar: number;
    sisa: number;
  };
  company: {
    bank_nama: string | null;
    bank_nomor_rekening: string | null;
    bank_pemilik: string | null;
    company_name: string;
    pt_name: string;
  };
  kategori_items?: {
    id: number;
    nama: string;
    harga: number;
    komisi: number;
    dibayar: number;
    sisa: number;
  }[];
}

export default function Bayar() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BayarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bankPengirim, setBankPengirim] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [nominalBayar, setNominalBayar] = useState("");
  const [selectedKategoriId, setSelectedKategoriId] = useState<number | null>(null);
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [banks, setBanks] = useState<{ kode: string; nama: string }[]>([]);
  const [ewallets, setEwallets] = useState<{ kode: string; nama: string }[]>(
    []
  );

  useEffect(() => {
    if (!id) return;
    api
      .get(`/pendaftaran/bayar/${id}`)
      .then((res) => {
        if (res.data?.pendaftar) {
          setData(res.data);
        } else if (res.data?.data?.pendaftar) {
          setData(res.data.data);
        } else {
          setError("Data tidak ditemukan");
        }
      })
      .catch(() => setError("Data tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api
      .get("/banks")
      .then((res) => {
        setBanks(res.data?.banks || []);
        setEwallets(res.data?.ewallets || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (
      data?.kategori_items &&
      data.kategori_items.length > 0 &&
      !nominalBayar
    ) {
      const firstUnpaid = data.kategori_items.find((k) => k.sisa > 0);
      if (firstUnpaid) {
        setSelectedKategoriId(firstUnpaid.id);
        setNominalBayar(String(firstUnpaid.sisa));
      } else {
        setSelectedKategoriId(data.kategori_items[0].id);
        setNominalBayar(String(data.kategori_items[0].harga));
      }
    }
  }, [data]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fileBukti || !bankPengirim || !namaPemilik || !nominalBayar) return;
    if (!data) return;

    setUploadError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("jumlah", nominalBayar);
      fd.append("kategori_id", String(selectedKategoriId || data.kategori_items?.[0]?.id || 1));
      fd.append("bukti_pembayaran", fileBukti);
      fd.append("bank_pengirim", bankPengirim);
      fd.append("nama_pengirim", namaPemilik);

      await api.post(`/pendaftar/${data.pendaftar.id}/bayar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Gagal mengupload bukti bayar";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  const statusLabel: Record<string, string> = {
    unpaid: "Belum melakukan pembayaran",
    processing: "Menunggu Verifikasi",
    verified: "Lunas",
    pending: "Pending",
  };

  const statusColors: Record<string, string> = {
    unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    verified: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-slate-100 text-slate-800 border-slate-200",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            Data tidak ditemukan
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Tagihan tidak ditemukan atau telah kadaluwarsa
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-lg text-sm"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  if (data.pendaftar.status_pembayaran === "verified") {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Pembayaran Lunas!
          </h1>
          <p className="text-sm text-gray-500 mb-2">
            Terima kasih, pembayaran Anda telah terverifikasi.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Invoice: {data.no_invoice}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold"
          >
            Kembali
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Confetti decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="confetti confetti-1" />
          <div className="confetti confetti-2" />
          <div className="confetti confetti-3" />
          <div className="confetti confetti-4" />
          <div className="confetti confetti-5" />
          <div className="confetti confetti-6" />
          <div className="confetti confetti-7" />
          <div className="confetti confetti-8" />
          <div className="confetti confetti-9" />
          <div className="confetti confetti-10" />
          <div className="confetti confetti-11" />
          <div className="confetti confetti-12" />
          <div className="absolute top-[10%] left-[5%] text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</div>
          <div className="absolute top-[15%] right-[8%] text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
          <div className="absolute bottom-[20%] left-[10%] text-3xl animate-bounce" style={{ animationDelay: '0.8s' }}>🎺</div>
          <div className="absolute bottom-[25%] right-[5%] text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</div>
          <div className="absolute top-[40%] left-[3%] text-2xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
          <div className="absolute top-[50%] right-[3%] text-2xl animate-bounce" style={{ animationDelay: '0.7s' }}>✨</div>
          <div className="absolute top-[8%] left-[45%] text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎊</div>
          <div className="absolute bottom-[10%] right-[20%] text-3xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎺</div>
        </div>

        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            animation: confetti-fall linear infinite;
          }
          .confetti-1 { left: 5%; background: #10b981; animation-duration: 3s; animation-delay: 0s; }
          .confetti-2 { left: 15%; background: #f59e0b; animation-duration: 2.5s; animation-delay: 0.3s; width: 8px; height: 12px; border-radius: 50%; }
          .confetti-3 { left: 25%; background: #3b82f6; animation-duration: 3.5s; animation-delay: 0.6s; }
          .confetti-4 { left: 35%; background: #ef4444; animation-duration: 2.8s; animation-delay: 0.2s; width: 12px; height: 8px; }
          .confetti-5 { left: 45%; background: #8b5cf6; animation-duration: 3.2s; animation-delay: 0.8s; border-radius: 50%; }
          .confetti-6 { left: 55%; background: #10b981; animation-duration: 2.7s; animation-delay: 0.1s; width: 6px; height: 10px; }
          .confetti-7 { left: 65%; background: #f59e0b; animation-duration: 3.3s; animation-delay: 0.5s; }
          .confetti-8 { left: 75%; background: #ec4899; animation-duration: 2.9s; animation-delay: 0.4s; width: 10px; height: 6px; border-radius: 50%; }
          .confetti-9 { left: 85%; background: #3b82f6; animation-duration: 3.1s; animation-delay: 0.7s; }
          .confetti-10 { left: 92%; background: #ef4444; animation-duration: 2.6s; animation-delay: 0.9s; width: 8px; height: 12px; border-radius: 50%; }
          .confetti-11 { left: 50%; background: #10b981; animation-duration: 3.4s; animation-delay: 0.15s; width: 7px; height: 7px; border-radius: 50%; }
          .confetti-12 { left: 20%; background: #f59e0b; animation-duration: 2.4s; animation-delay: 0.65s; width: 11px; height: 7px; }
        `}</style>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 max-w-md w-full text-center relative z-10 fade-in border border-emerald-100">
          {/* Animated checkmark */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-20" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Bukti pembayaran Anda telah berhasil dikirim.<br />
            Silakan tunggu verifikasi dari admin.
          </p>

          {/* Info card */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📋</span>
              </div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Detail Pembayaran</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-mono font-bold text-gray-900">{data?.no_invoice || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Menunggu Verifikasi
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1.5">
            <span>💬</span> Notifikasi akan dikirim via WhatsApp setelah diverifikasi
          </p>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0E6187] to-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:from-[#1a5e6f] hover:to-[#243f5e] transition-all shadow-lg shadow-[#0E6187]/20 hover:shadow-xl hover:shadow-[#0E6187]/30"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <a href="/">
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </a>
          <span className="text-lg font-bold text-slate-900">
            {data.company.company_name}
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* status card */}
        <div
          className={`rounded-lg border p-4 text-sm mb-6 ${
            statusColors[data.pendaftar.status_pembayaran] || statusColors.pending
          }`}
        >
          <span className="font-semibold">
            Status:{" "}
            {statusLabel[data.pendaftar.status_pembayaran] ||
              data.pendaftar.status_pembayaran}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* left: data tagihan - 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
                  <FileText size={18} className="text-[#0E6187]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Invoice</p>
                  <p className="text-sm font-bold font-mono">{data.no_invoice}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pendaftar</span>
                  <span className="font-semibold">{data.pendaftar.nama}</span>
                </div>
                {data.product && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Program</span>
                    <span className="font-semibold">{data.product.nama}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span>{data.pendaftar.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">WhatsApp</span>
                  <span>{data.pendaftar.telepon}</span>
                </div>
              </div>

              {data.kategori_items && data.kategori_items.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-xs text-slate-500 mb-2">
                    Kategori Pembayaran
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{data.kategori_items[0].nama}</span>
                      <span>{fmt(data.kategori_items[0].harga)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tagihan</span>
                  <span>{fmt(data.keuangan.total_tagihan)}</span>
                </div>
                {data.keuangan.diskon > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon</span>
                    <span>-{fmt(data.keuangan.diskon)}</span>
                  </div>
                )}
                {data.keuangan.total_dibayar > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Terbayar</span>
                    <span>{fmt(data.keuangan.total_dibayar)}</span>
                  </div>
                )}
                {data.keuangan.sisa > 0 && (
                  <div className="flex justify-between text-base font-bold border-t border-slate-100 pt-2">
                    <span>Sisa yang harus dibayar</span>
                    <span className="text-[#0E6187]">
                      {fmt(data.keuangan.sisa)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* info bank */}
            {data.company.bank_nama && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    Transfer Pembayaran
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Bank</p>
                    <p className="text-sm font-bold">{data.company.bank_nama}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nomor Rekening</p>
                    <p className="text-lg font-bold font-mono tracking-wider text-[#0E6187]">
                      {data.company.bank_nomor_rekening}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">a.n.</p>
                      <p className="text-sm font-semibold">
                        {data.company.bank_pemilik}
                      </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right: form bayar - 3/5 */}
          <div className="lg:col-span-3">
            {data.keuangan.sisa > 0 &&
              data.pendaftar.status_pembayaran !== "verified" && (
                <div className="bg-white rounded-lg border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Upload size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          4. Data Pembayaran
                        </h3>
                        <p className="text-xs text-slate-500">
                          Isi detail pembayaran Anda
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {uploadError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {uploadError}
                      </div>
                    )}

                    {data.pendaftar.status_pembayaran === "processing" ? (
                      <p className="text-sm text-slate-500">
                        Bukti pembayaran sedang diverifikasi. Silakan tunggu.
                      </p>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Bank / E-Wallet Pengirim{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={bankPengirim}
                            onChange={(e) => setBankPengirim(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                          >
                            <option value="">Pilih Bank / E-Wallet</option>
                            {banks.length > 0 && (
                              <optgroup label="Bank">
                                {banks.map((b) => (
                                  <option key={b.kode} value={b.kode}>
                                    {b.nama}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {ewallets.length > 0 && (
                              <optgroup label="E-Wallet">
                                {ewallets.map((e) => (
                                  <option key={e.kode} value={e.kode}>
                                    {e.nama}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nama Pemilik Rekening{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={namaPemilik}
                            onChange={(e) => setNamaPemilik(e.target.value)}
                            placeholder="Nama di rekening"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Sesuai dengan nama yang tercantum di rekening
                          </p>
                        </div>

                        {data.kategori_items && data.kategori_items.find((k) => k.sisa > 0) && (() => {
                          const currentKategori = data.kategori_items!.find((k) => k.sisa > 0)!;
                          return (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Bayar untuk
                              </label>
                              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm">
                                <span className="font-semibold text-slate-900">{currentKategori.nama}</span>
                                <span className="text-slate-500 ml-2">— Sisa {fmt(currentKategori.sisa)}</span>
                              </div>
                            </div>
                          );
                        })()}

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nominal Pembayaran{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                              Rp
                            </span>
                            <input
                              type="number"
                              required
                              min={1000}
                              value={nominalBayar}
                              onChange={(e) =>
                                setNominalBayar(e.target.value)
                              }
                              placeholder="0"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Transfer sesuai nominal{" "}
                            {data.kategori_items?.find((k) => k.id === selectedKategoriId)?.nama || "tagihan"}:{" "}
                            <strong>
                              {(() => {
                                const sel = data.kategori_items?.find((k) => k.id === selectedKategoriId);
                                return sel ? fmt(sel.sisa > 0 ? sel.sisa : sel.harga) : fmt(data.keuangan.total_tagihan);
                              })()}
                            </strong>
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Upload Bukti Pembayaran{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                            <CreditCard
                              size={28}
                              className="mx-auto mb-2 text-slate-400"
                            />
                            {fileBukti ? (
                              <p className="text-sm text-green-600 font-medium truncate">
                                {fileBukti.name}
                              </p>
                            ) : (
                              <>
                                <p className="text-sm text-slate-500 mb-1">
                                  JPG, PNG, atau PDF
                                </p>
                                <p className="text-xs text-slate-400">
                                  Maksimal 5 MB
                                </p>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) =>
                                setFileBukti(e.target.files?.[0] || null)
                              }
                              className="mt-3 w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#0E6187] file:text-white hover:file:bg-[#1a5e6f] cursor-pointer"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={
                            !fileBukti ||
                            !bankPengirim ||
                            !namaPemilik ||
                            !nominalBayar ||
                            uploading
                          }
                          className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {uploading ? (
                            <>
                              <Loader size={16} className="animate-spin" />{" "}
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <Upload size={16} /> Kirim Pembayaran
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
