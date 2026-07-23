import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Check,
  Loader,
  Upload,
  Search,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import api from "../../services/api";

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

function fmt(n: number) {
  return "Rp. " + n.toLocaleString("id-ID").replace(/,/g, ".");
}

function maskName(name: string) {
  if (!name) return "••••••••";
  const parts = name.split(" ");
  return parts
    .map((part) => {
      if (part.length <= 2) return "••";
      return (
        "•".repeat(part.length - 2) +
        part.slice(-2)
      );
    })
    .join(" ");
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  if (user.length <= 6) return "•".repeat(user.length) + "@" + domain;
  return "•".repeat(user.length - 6) + user.slice(-6) + "@" + domain;
}

function maskPhone(phone: string) {
  if (phone.length <= 6) return "•".repeat(phone.length);
  return "•".repeat(phone.length - 6) + phone.slice(-6);
}

export default function KonfirmasiPembayaran() {
  const { id: routeId } = useParams<{ id: string }>();

  const [lookupValue, setLookupValue] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [data, setData] = useState<BayarData | null>(null);
  const [loading, setLoading] = useState(false);

  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (routeId) {
      setLookupValue(routeId);
      fetchPendaftar(routeId);
    }
  }, [routeId]);

  function extractId(val: string): string | null {
    const trimmed = val.trim();
    // Accept numeric ID directly
    if (/^\d+$/.test(trimmed)) return trimmed;
    // Accept INV/XXXXX/YYYYMM format — extract the numeric part (pendaftar ID)
    const invMatch = trimmed.match(/INV\/?(\d+)/i);
    if (invMatch) return invMatch[1];
    return null;
  }

  async function fetchPendaftar(rawInput: string) {
    const pendaftarId = extractId(rawInput);
    if (!pendaftarId) {
      setLookupError("Masukkan ID pendaftar atau nomor invoice yang valid");
      return;
    }

    setLookupError("");
    setLooking(true);
    setLoading(true);

    try {
      const res = await api.get(`/pendaftaran/bayar/${pendaftarId}`);
      const d = res.data?.pendaftar
        ? res.data
        : res.data?.data?.pendaftar
          ? res.data.data
          : null;
      if (!d || !d.pendaftar) {
        setLookupError(
          "Data tidak ditemukan. Periksa kembali ID atau nomor invoice Anda."
        );
        setData(null);
      } else {
        setData(d);
      }
    } catch {
      setLookupError(
        "Data tidak ditemukan. Periksa kembali ID atau nomor invoice Anda."
      );
      setData(null);
    } finally {
      setLooking(false);
      setLoading(false);
    }
  }

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    fetchPendaftar(lookupValue);
  }

  function handleBack() {
    setData(null);
    setFileBukti(null);
    setSubmitError("");
    setSuccess(false);
    setLookupValue(routeId ? "" : lookupValue);
  }

  async function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();
    if (!fileBukti || !data) return;

    setSubmitError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      const firstKategori = data.kategori_items?.[0];
      const jumlah = firstKategori
        ? firstKategori.sisa > 0
          ? firstKategori.sisa
          : firstKategori.harga
        : data.keuangan.sisa > 0
          ? data.keuangan.sisa
          : data.keuangan.total_tagihan;

      fd.append("jumlah", String(jumlah));
      fd.append("kategori_id", String(firstKategori?.id || 1));
      fd.append("bukti_pembayaran", fileBukti);

      await api.post(`/pendaftar/${data.pendaftar.id}/bayar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { message?: string } };
          }
        )?.response?.data?.message || "Gagal mengupload bukti pembayaran";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // --- SUCCESS SCREEN ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#0E6187] py-12 px-4 font-sans flex flex-col items-center">
        <div className="w-full max-w-[460px] mx-auto mt-6">
          <div className="bg-white rounded-2xl pt-10 pb-8 px-6 relative text-center shadow-sm">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#00C853] rounded-full border-[3px] border-[#0E6187] flex items-center justify-center shadow-sm">
              <Check size={26} className="text-white" strokeWidth={3} />
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Bukti Terkirim!
            </h1>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
              Bukti pembayaran Anda berhasil dikirim dan akan segera diverifikasi
              oleh admin.
            </p>

            <div className="bg-[#FFF9E5] border border-yellow-100 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-gray-500">Invoice</span>
                <span className="font-bold text-gray-800">
                  {data?.no_invoice || "-"}
                </span>
              </div>
              <div className="flex justify-between text-[13px] items-center">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1.5 text-yellow-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Menunggu Verifikasi
                </span>
              </div>
            </div>

            <a
              href="/"
              className="inline-block w-full py-3 bg-[#00D1FF] text-white font-bold rounded-lg text-[13px] hover:bg-[#00bce6] transition-colors"
            >
              KEMBALI KE BERANDA
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  // --- LOOKUP SCREEN (!data) ---
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0E6187] py-12 px-4 font-sans flex flex-col items-center">
        <div className="w-full max-w-[460px] mx-auto mt-6">
          <div className="bg-white rounded-2xl pt-10 pb-8 px-6 relative shadow-sm">
            <div className="text-center mb-6">
              <h1 className="text-[18px] font-bold text-gray-800 mb-1">
                Konfirmasi Pembayaran
              </h1>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Silahkan masukkan NOMOR INVOICE Anda terlebih dahulu
              </p>
              <p className="text-[12px] text-gray-400 mt-2 leading-relaxed">
                Jika nomor invoice yang anda masukkan benar, Anda bisa melakukan
                proses konfirmasi selanjutnya.
              </p>
            </div>

            <form onSubmit={handleLookup} className="text-left">
              <div className="mb-4">
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => {
                    setLookupValue(e.target.value);
                    setLookupError("");
                  }}
                  placeholder="Contoh: 8 atau INV/00008/202607"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-colors text-[14px] text-center font-mono tracking-widest"
                  autoFocus
                />
              </div>

              {lookupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    className="text-red-500 mt-0.5 shrink-0"
                  />
                  <p className="text-[12px] text-red-600 leading-snug">
                    {lookupError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!lookupValue.trim() || looking}
                className="w-full py-3 bg-[#00D1FF] text-white font-bold rounded-lg text-[13px] hover:bg-[#00bce6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {looking ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                {looking ? "MENCARI..." : "CARI INVOICE"}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-white text-[12px] opacity-90">
            <ShieldCheck size={16} className="text-[#00D166]" />
            <span>Informasi Pribadi Anda Aman</span>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM SCREEN (Data Loaded) ---
  const firstKategori = data.kategori_items?.[0];
  const totalBayar = firstKategori
    ? firstKategori.sisa > 0
      ? firstKategori.sisa
      : firstKategori.harga
    : data.keuangan.sisa > 0
      ? data.keuangan.sisa
      : data.keuangan.total_tagihan;

  const isPaid = data.pendaftar.status_pembayaran === "verified";
  const isProcessing = data.pendaftar.status_pembayaran === "processing";

  return (
    <div className="min-h-screen bg-[#0E6187] py-12 px-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-[460px] mx-auto mt-6">
        {/* BAGIAN 1: HEADER */}
        <div className="bg-white rounded-t-2xl pt-8 pb-6 px-6 relative shadow-sm">
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>

          <div className="text-center mb-5">
            <h1 className="text-[18px] font-bold text-gray-800 mb-1">
              Konfirmasi Pembayaran
            </h1>
            <p className="text-[13px] text-gray-500">
              Silahkan masukkan NOMOR INVOICE Anda terlebih dahulu
            </p>
          </div>

          {/* Invoice Number Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mb-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
              No. Invoice
            </p>
            <p className="text-[18px] font-bold font-mono text-[#0E6187] tracking-wider">
              {data.no_invoice}
            </p>
          </div>
        </div>

        {/* PEMBATAS TIKET */}
        <div className="relative h-5 bg-white">
          <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
        </div>

        {/* BAGIAN 2: DETAIL PESANAN */}
        <div className="bg-white py-6 px-6">
          <div className="bg-[#FFF9E5] border border-yellow-100 rounded-lg p-3 mb-5">
            <p className="text-[13px] text-gray-700 text-center font-medium">
              Pastikan data pesanan ini adalah{" "}
              <span className="font-bold text-gray-900">BENAR</span> milik Anda
            </p>
          </div>

          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">invoice_id:</span>
              <span className="font-bold font-mono text-gray-800">
                {data.pendaftar.id}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">product:</span>
              <span className="font-medium text-gray-800 text-right max-w-[220px] leading-tight">
                {data.product?.nama || "-"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">name:</span>
              <span className="font-medium text-gray-800">
                {maskName(data.pendaftar.nama)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">email:</span>
              <span className="font-medium text-gray-800">
                {maskEmail(data.pendaftar.email)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">phone:</span>
              <span className="font-medium text-gray-800">
                {maskPhone(data.pendaftar.telepon)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">transfer:</span>
              <span className="font-bold text-[#0E6187]">
                {fmt(totalBayar)}
              </span>
            </div>
          </div>
        </div>

        {/* PEMBATAS TIKET */}
        <div className="relative h-5 bg-white">
          <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
        </div>

        {/* BAGIAN 3: FORM UPLOAD / STATUS */}
        <div className="bg-white rounded-b-2xl py-6 px-6">
          {isPaid ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#00C853]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#00C853]" strokeWidth={3} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-800 mb-1">
                Pembayaran Lunas
              </h2>
              <p className="text-[13px] text-gray-500">
                Pembayaran Anda telah terverifikasi. Terima kasih!
              </p>
            </div>
          ) : isProcessing ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader
                  size={32}
                  className="text-yellow-600 animate-spin"
                />
              </div>
              <h2 className="text-[16px] font-bold text-gray-800 mb-1">
                Sedang Diverifikasi
              </h2>
              <p className="text-[13px] text-gray-500">
                Bukti pembayaran Anda sedang diverifikasi oleh admin. Mohon
                tunggu.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-[15px] font-bold text-gray-800 mb-5">
                Bukti Transfer
              </h2>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-[12px] text-red-600 flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                  />
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-4 text-[13px]">
                <div>
                  <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-md p-5 text-center hover:border-gray-400 transition-colors">
                    <Upload
                      size={28}
                      className="mx-auto mb-2 text-gray-400"
                    />
                    {fileBukti ? (
                      <p className="text-[13px] text-[#0E6187] font-medium truncate px-4">
                        {fileBukti.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-[13px] text-gray-500 mb-0.5">
                          JPG, PNG, atau PDF
                        </p>
                        <p className="text-[11px] text-gray-400">
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
                      className="mt-3 w-full text-[12px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-bold file:bg-[#0E6187] file:text-white hover:file:bg-[#114b69] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-[#FFF9E5] border border-yellow-100 rounded-md p-3 text-center text-[12px] text-gray-600 leading-relaxed">
                  Pastikan konfirmasi pembayaran hanya dilakukan setelah
                  pembayaran dilakukan.
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!fileBukti || submitting}
                    className="w-full py-3 bg-[#22C55E] text-white font-bold rounded-lg text-[13px] hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader size={16} className="animate-spin" />{" "}
                        MENGIRIM...
                      </>
                    ) : (
                      "KIRIM KONFIRMASI"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* FOOTER AMAN */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white text-[12px] opacity-90 pb-8">
          <ShieldCheck size={16} className="text-[#00D166]" />
          <span>Informasi Pribadi Anda Aman</span>
        </div>
      </div>
    </div>
  );
}
