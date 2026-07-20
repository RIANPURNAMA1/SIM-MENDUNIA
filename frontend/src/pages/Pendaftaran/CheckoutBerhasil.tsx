import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Clock, Copy, FileText, CreditCard, AlertTriangle } from "lucide-react";
import api from "../../services/api";

interface CheckoutData {
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
  };
  no_invoice: string;
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function CheckoutBerhasil() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/pendaftaran/bayar/${id}`)
      .then((res) => {
        if (res.data?.pendaftar) setData(res.data);
        else if (res.data?.data?.pendaftar) setData(res.data.data);
        else setError("Data tidak ditemukan");
      })
      .catch(() => setError("Data tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.pendaftar?.created_at) return;

    const created = new Date(data.pendaftar.created_at);
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);

    function updateCountdown() {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      timeZoneName: "short",
    };
    return d.toLocaleDateString("id-ID", options);
  }

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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mb-4">Invoice tidak ditemukan atau telah kadaluwarsa</p>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E6187] text-white rounded-lg text-sm">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const bankName = data.company.bank_nama || "BCA";
  const bankAccount = data.company.bank_nomor_rekening || "1831813364";
  const bankOwner = data.company.bank_pemilik || "PT. INDONESIA SUKSES MENDUNIA";
  const totalBayar = data.keuangan.sisa > 0 ? data.keuangan.sisa : data.keuangan.total_tagihan;
  const deadlineDate = new Date(new Date(data.pendaftar.created_at).getTime() + 24 * 60 * 60 * 1000);

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

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout berhasil</h1>
        </div>

        {/* Countdown Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Batas akhir pembayaran</p>
              <p className="text-sm text-gray-500">Jatuh tempo {formatDate(deadlineDate.toISOString())}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">Yuk, buruan selesaikan pembayaranmu.</p>
          <p className="text-xs text-gray-500 mb-5">
            Kami verifikasi pesananmu kurang dari 15 menit setelah pembayaran berhasil dan paling lambat 1x24 jam.
          </p>

          <div className={`flex items-center justify-center gap-4 p-4 rounded-lg ${isExpired ? "bg-red-50 border border-red-200" : "bg-[#0E6187] text-white"}`}>
            {isExpired ? (
              <div className="text-center">
                <p className="text-sm font-bold text-red-600">Pembayaran Telah Kadaluarsa</p>
                <p className="text-xs text-red-500 mt-1">Silakan daftar ulang</p>
              </div>
            ) : (
              <>
                {countdown.days > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold tabular-nums">{String(countdown.days).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">Hari</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums">{String(countdown.hours).padStart(2, "0")}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Jam</div>
                </div>
                <span className="text-3xl font-bold">:</span>
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums">{String(countdown.minutes).padStart(2, "0")}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Menit</div>
                </div>
                <span className="text-3xl font-bold">:</span>
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums">{String(countdown.seconds).padStart(2, "0")}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Detik</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bank Transfer Info */}
        {!isExpired && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <p className="text-sm font-bold text-gray-900 mb-4">Tolong transfer ke</p>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Bank</p>
                <p className="text-sm font-bold text-gray-900">{bankName} a.n {bankOwner}</p>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">No. rekening</p>
                  <p className="text-lg font-bold font-mono text-[#0E6187] tracking-wider">{bankAccount}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankAccount, "rek")}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Salin"
                >
                  <Copy size={16} className={copiedField === "rek" ? "text-green-600" : "text-gray-400"} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total Pembayaran</p>
                  <p className="text-lg font-bold font-mono text-[#0E6187]">{fmt(totalBayar)}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(totalBayar).replace(/[^0-9]/g, ""), "nominal")}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Salin"
                >
                  <Copy size={16} className={copiedField === "nominal" ? "text-green-600" : "text-gray-400"} />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Penting!</strong> Mohon transfer sampai 3 digit terakhir yaitu {fmt(totalBayar)} karena sistem kami tidak bisa mengenali pembayaranmu bila jumlahnya tidak sesuai.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-[#0E6187]" />
              <span className="text-sm font-semibold text-gray-900">Lihat Detail Pesanan</span>
            </div>
            <span className={`text-gray-400 transition-transform ${showDetail ? "rotate-180" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>

          {showDetail && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-mono font-bold text-gray-900">{data.no_invoice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Program</span>
                <span className="font-medium text-gray-900">{data.product?.nama || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium text-gray-900">{data.pendaftar.nama}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{data.pendaftar.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Tagihan</span>
                <span className="font-bold text-gray-900">{fmt(data.keuangan.total_tagihan)}</span>
              </div>
              {data.keuangan.diskon > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span>-{fmt(data.keuangan.diskon)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-amber-600">Menunggu Pembayaran</span>
              </div>
            </div>
          )}
        </div>

        {/* Konfirmasi Pembayaran Link */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Konfirmasi pembayaran melalui halaman ini</p>
          <p className="text-xs text-gray-500 mb-4">Setelah melakukan transfer, unggah bukti pembayaran Anda</p>
          <a
            href={`/konfirmasi-pembayaran/${data.pendaftar.id}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] transition-colors"
          >
            <CreditCard size={16} /> Konfirmasi Pembayaran
          </a>
        </div>
      </div>
    </div>
  );
}
