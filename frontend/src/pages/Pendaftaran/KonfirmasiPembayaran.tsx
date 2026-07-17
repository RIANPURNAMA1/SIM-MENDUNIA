import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  CreditCard,
  FileText,
  CheckCircle,
  Loader,
  Upload,
  Building2,
  ArrowLeft,
  Search,
  AlertTriangle,
  Copy,
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
  return "Rp " + n.toLocaleString("id-ID");
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const masked =
    user.length <= 2
      ? user[0] + "***"
      : user[0] + "***" + user[user.length - 1];
  return `${masked}@${domain}`;
}

function maskPhone(phone: string) {
  if (phone.length <= 4) return "****";
  return (
    phone.slice(0, 3) +
    "***" +
    phone.slice(phone.length - 3)
  );
}

export default function KonfirmasiPembayaran() {
  const { id: routeId } = useParams<{ id: string }>();

  const [lookupValue, setLookupValue] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [data, setData] = useState<BayarData | null>(null);
  const [loading, setLoading] = useState(false);

  const [bankPengirim, setBankPengirim] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [nominalBayar, setNominalBayar] = useState("");
  const [selectedKategoriId, setSelectedKategoriId] = useState<number | null>(null);
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [banks, setBanks] = useState<{ kode: string; nama: string }[]>([]);
  const [ewallets, setEwallets] = useState<{ kode: string; nama: string }[]>([]);

  useEffect(() => {
    api
      .get("/banks")
      .then((res) => {
        setBanks(res.data?.banks || []);
        setEwallets(res.data?.ewallets || []);
      })
      .catch(() => {});
  }, []);

  // Auto-fetch if route has :id param
  useEffect(() => {
    if (routeId) {
      setLookupValue(routeId);
      fetchPendaftar(routeId);
    }
  }, [routeId]);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function extractId(val: string): string | null {
    const trimmed = val.trim();
    // Accept numeric ID directly
    if (/^\d+$/.test(trimmed)) return trimmed;
    // Accept INV/XXXXX/YYYYMM format — extract the numeric part
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
      const d = res.data?.pendaftar ? res.data : res.data?.data?.pendaftar ? res.data.data : null;
      if (!d || !d.pendaftar) {
        setLookupError("Data tidak ditemukan. Periksa kembali ID atau nomor invoice Anda.");
        setData(null);
      } else {
        setData(d);
        const firstUnpaid = d.kategori_items?.find((k: { sisa: number }) => k.sisa > 0);
        if (firstUnpaid) {
          setSelectedKategoriId(firstUnpaid.id);
          setNominalBayar(String(firstUnpaid.sisa));
        } else {
          setSelectedKategoriId(d.kategori_items?.[0]?.id ?? null);
          setNominalBayar(String(d.keuangan.sisa > 0 ? d.keuangan.sisa : d.keuangan.total_tagihan));
        }
      }
    } catch {
      setLookupError("Data tidak ditemukan. Periksa kembali ID atau nomor invoice Anda.");
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

  async function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();
    if (!fileBukti || !bankPengirim || !namaPemilik || !nominalBayar || !data) return;

    setSubmitError("");
    setSubmitting(true);

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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal mengupload bukti pembayaran";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bukti Pembayaran Terkirim!</h1>
          <p className="text-sm text-gray-500 mb-3">
            Bukti pembayaran Anda telah berhasil dikirim dan akan segera diverifikasi oleh admin.
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice</span>
              <span className="font-mono font-bold text-gray-900">{data?.no_invoice || "-"}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Menunggu Verifikasi
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            Notifikasi akan dikirim via WhatsApp setelah diverifikasi.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  // ─── Lookup phase ──────────────────────────────────────────────
  if (!data && !loading) {
    return (
      <div className="min-h-screen bg-[#0E6187]">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo-sm.png" alt="Mendunia" className="w-6 h-6" />
              <span className="text-lg font-bold text-gray-900">Mendunia.id</span>
            </a>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Konfirmasi Pembayaran</h1>
            <p className="text-sm text-gray-500">
              Masukkan nomor invoice atau ID pendaftar Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleLookup} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Invoice / ID Pendaftar
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupValue}
                onChange={(e) => {
                  setLookupValue(e.target.value);
                  setLookupError("");
                }}
                placeholder="Contoh: INV/00001/202607 atau 1"
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-colors text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!lookupValue.trim() || looking}
                className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {looking ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                Cari
              </button>
            </div>

            {lookupError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{lookupError}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const bankName = data.company.bank_nama || "BCA";
  const bankAccount = data.company.bank_nomor_rekening || "1831813364";
  const bankOwner = data.company.bank_pemilik || "PT. INDONESIA SUKSES MENDUNIA";
  const totalBayar = data.keuangan.sisa > 0 ? data.keuangan.sisa : data.keuangan.total_tagihan;

  const isPaid = data.pendaftar.status_pembayaran === "verified";
  const isProcessing = data.pendaftar.status_pembayaran === "processing";

  // ─── Main page ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0E6187]">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <a href="/konfirmasi-pembayaran" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </a>
          <img src="/logo-sm.png" alt="Mendunia" className="w-6 h-6" />
          <span className="text-lg font-bold text-gray-900">Mendunia.id</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Konfirmasi Pembayaran</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: order details — 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <FileText size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invoice</p>
                  <p className="text-sm font-bold font-mono text-gray-900">{data.no_invoice}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-semibold text-gray-900">{data.pendaftar.nama}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-700">{maskEmail(data.pendaftar.email)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">WhatsApp</span>
                  <span className="text-gray-700">{maskPhone(data.pendaftar.telepon)}</span>
                </div>
                {data.product && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Program</span>
                    <span className="font-medium text-gray-900">{data.product.nama}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tagihan</span>
                  <span className="text-gray-900">{fmt(data.keuangan.total_tagihan)}</span>
                </div>
                {data.keuangan.diskon > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon</span>
                    <span>-{fmt(data.keuangan.diskon)}</span>
                  </div>
                )}

                {data.kategori_items && data.kategori_items.length > 0 && (() => {
                  const currentKategori = data.kategori_items.find((k) => k.sisa > 0);
                  if (!currentKategori) return null;
                  return (
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1.5">Rincian kategori</p>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{currentKategori.nama}</span>
                        <span className="font-medium text-amber-600">
                          {fmt(currentKategori.sisa)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                  <span>{data.keuangan.sisa > 0 ? "Sisa yang harus dibayar" : "Total Tagihan"}</span>
                  <span className="text-[#0E6187]">{fmt(totalBayar)}</span>
                </div>
              </div>
            </div>

            {/* Bank info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={18} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Transfer Pembayaran</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="text-sm font-bold text-gray-900">{bankName} a.n {bankOwner}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nomor Rekening</p>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-bold font-mono tracking-wider text-[#0E6187]">{bankAccount}</p>
                    <button
                      onClick={() => copyToClipboard(bankAccount, "rek")}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Salin"
                    >
                      <Copy size={16} className={copiedField === "rek" ? "text-green-600" : "text-gray-400"} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: payment form — 3/5 */}
          <div className="lg:col-span-3">
            {isPaid ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Pembayaran Lunas</h2>
                <p className="text-sm text-gray-500">Pembayaran Anda telah terverifikasi. Terima kasih!</p>
              </div>
            ) : isProcessing ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader size={32} className="text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Sedang Diverifikasi</h2>
                <p className="text-sm text-gray-500">
                  Bukti pembayaran Anda sedang diverifikasi oleh admin. Mohon tunggu.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Upload size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Upload Bukti Pembayaran</h3>
                      <p className="text-xs text-gray-500">Isi detail pembayaran Anda di bawah ini</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {submitError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitPayment} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank / E-Wallet Pengirim <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={bankPengirim}
                        onChange={(e) => setBankPengirim(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-colors text-sm"
                      >
                        <option value="">Pilih Bank / E-Wallet</option>
                        {banks.length > 0 && (
                          <optgroup label="Bank">
                            {banks.map((b) => (
                              <option key={b.kode} value={b.kode}>{b.nama}</option>
                            ))}
                          </optgroup>
                        )}
                        {ewallets.length > 0 && (
                          <optgroup label="E-Wallet">
                            {ewallets.map((e) => (
                              <option key={e.kode} value={e.kode}>{e.nama}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Pemilik Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaPemilik}
                        onChange={(e) => setNamaPemilik(e.target.value)}
                        placeholder="Nama sesuai di rekening"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-colors text-sm"
                      />
                    </div>

                    {data.kategori_items && data.kategori_items.find((k) => k.sisa > 0) && (() => {
                      const currentKategori = data.kategori_items!.find((k) => k.sisa > 0)!;
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bayar untuk
                          </label>
                          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            <span className="font-semibold text-gray-900">{currentKategori.nama}</span>
                            <span className="text-gray-500 ml-2">— Sisa {fmt(currentKategori.sisa)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nominal Pembayaran <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                        <input
                          type="number"
                          required
                          min={1000}
                          value={nominalBayar}
                          onChange={(e) => setNominalBayar(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187] outline-none transition-colors text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Transfer tepat sampai 3 digit terakhir: <strong>{fmt(Number(nominalBayar) || totalBayar)}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Bukti Pembayaran <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <CreditCard size={28} className="mx-auto mb-2 text-gray-400" />
                        {fileBukti ? (
                          <p className="text-sm text-green-600 font-medium truncate">{fileBukti.name}</p>
                        ) : (
                          <>
                            <p className="text-sm text-gray-500 mb-1">JPG, PNG, atau PDF</p>
                            <p className="text-xs text-gray-400">Maksimal 5 MB</p>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setFileBukti(e.target.files?.[0] || null)}
                          className="mt-3 w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#0E6187] file:text-white hover:file:bg-[#1a5e6f] cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!fileBukti || !bankPengirim || !namaPemilik || !nominalBayar || submitting}
                      className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader size={16} className="animate-spin" /> Mengirim...
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Kirim Bukti Pembayaran
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
