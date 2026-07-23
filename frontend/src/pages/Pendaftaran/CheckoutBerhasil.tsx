import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../services/api";

interface KategoriItem {
  id: number;
  nama: string;
  harga: number;
  komisi: number;
  dibayar: number;
  sisa: number;
  jatuh_tempo_hari: number;
  tanggal_akhir: string | null;
}

interface CheckoutData {
  pendaftar: {
    id: number;
    nama: string;
    email: string;
    telepon: string;
    created_at: string;
    tanggal_persetujuan: string | null;
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
  kategori_items?: KategoriItem[];
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID").replace(/,/g, ".");
}

export default function CheckoutBerhasil() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [countdowns, setCountdowns] = useState<Record<number, { days: number; hours: number; minutes: number; seconds: number; expired: boolean; deadline: Date }>>({});

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
    if (!data?.kategori_items?.length) return;

    function updateCountdowns() {
      const now = new Date();
      const newCountdowns: typeof countdowns = {};
      for (const k of data!.kategori_items!) {
        if (k.sisa <= 0) continue;

        // Use tanggal_akhir from API (absolute date) if available
        let deadline: Date;
        if (k.tanggal_akhir) {
          deadline = new Date(k.tanggal_akhir + 'T23:59:59');
        } else {
          // Fallback: compute from tanggal_persetujuan + jatuh_tempo_hari
          const baseDate = data!.pendaftar.tanggal_persetujuan
            ? new Date(data!.pendaftar.tanggal_persetujuan)
            : new Date(data!.pendaftar.created_at);
          deadline = new Date(baseDate.getTime() + k.jatuh_tempo_hari * 24 * 60 * 60 * 1000);
        }

        const diff = deadline.getTime() - now.getTime();
        const expired = diff <= 0;
        const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((Math.abs(diff) % (1000 * 60)) / 1000);
        newCountdowns[k.id] = { days, hours, minutes, seconds, expired, deadline };
      }
      setCountdowns(newCountdowns);
    }

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
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
    return d.toLocaleDateString("id-ID", options).replace(/\./g, ":");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-xl max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mb-6">Invoice tidak ditemukan atau telah kadaluwarsa</p>
          <a href="/" className="inline-block w-full py-2.5 bg-[#00D1FF] text-white font-bold rounded-lg text-sm">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const bankName = data.company.bank_nama || "BCA";
  const bankAccount = data.company.bank_nomor_rekening || "1831813364";
  const bankOwner = data.company.bank_pemilik || "PT. INDONESIA SUKSES MENDUNIA";
  const unpaidItems = (data.kategori_items || []).filter(k => k.sisa > 0);
  const firstKategori = unpaidItems[0] || data.kategori_items?.[0];
  const totalBayar = firstKategori
    ? (firstKategori.sisa > 0 ? firstKategori.sisa : firstKategori.harga)
    : (data.keuangan.sisa > 0 ? data.keuangan.sisa : data.keuangan.total_tagihan);
  const primaryCountdown = firstKategori ? countdowns[firstKategori.id] : null;
  const paidItems = (data.kategori_items || []).filter(k => k.sisa <= 0);

  return (
    <div className="min-h-screen bg-[#0E6187] py-12 px-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-[460px] mx-auto">
        
        {/* --- BAGIAN 1: HEADER & COUNTDOWN --- */}
        <div className="bg-white rounded-t-2xl pt-10 pb-6 px-6 relative mt-6">
          {/* Floating Checkmark Icon */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#00C853] rounded-full border-[3px] border-[#0E6187] flex items-center justify-center shadow-sm">
            <Check size={26} className="text-white" strokeWidth={3} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-gray-800">{data.pendaftar.nama},</h1>
            <p className="text-[15px] text-gray-600">Checkout berhasil</p>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-500 leading-tight max-w-[100px]">
              {unpaidItems.length > 1 ? `Batas ${unpaidItems.length} tagihan` : 'Batas akhir pembayaran'}
            </span>
            {primaryCountdown && (
              <div className="flex gap-4">
                {primaryCountdown.days > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-red-500 tabular-nums tracking-widest">
                      {String(primaryCountdown.days).padStart(2, "0").split("").join(" ")}
                    </span>
                    <span className="text-[10px] text-red-500 font-medium">Hari</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-500 tabular-nums tracking-widest">
                    {String(primaryCountdown.hours).padStart(2, "0").split("").join(" ")}
                  </span>
                  <span className="text-[10px] text-red-500 font-medium">Jam</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-500 tabular-nums tracking-widest">
                    {String(primaryCountdown.minutes).padStart(2, "0").split("").join(" ")}
                  </span>
                  <span className="text-[10px] text-red-500 font-medium">Menit</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-500 tabular-nums tracking-widest">
                    {String(primaryCountdown.seconds).padStart(2, "0").split("").join(" ")}
                  </span>
                  <span className="text-[10px] text-red-500 font-medium">Detik</span>
                </div>
              </div>
            )}
          </div>
          
          {primaryCountdown && (
            <div className="text-right text-[11px] text-gray-500 mb-2">
              Jatuh tempo {formatDate(primaryCountdown.deadline.toISOString())}
            </div>
          )}

          {/* Per-Category Deadline List */}
          {unpaidItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {unpaidItems.map(k => {
                const cd = countdowns[k.id];
                if (!cd) return null;
                return (
                  <div key={k.id} className={`flex items-center justify-between rounded-md px-3 py-2 text-[12px] ${
                    cd.expired ? 'bg-red-50 border border-red-200' : 'bg-[#FFF9E5] border border-yellow-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${cd.expired ? 'text-red-600' : 'text-gray-800'}`}>{k.nama}</span>
                      <span className="text-gray-400">•</span>
                      <span className={`font-medium ${cd.expired ? 'text-red-500' : 'text-gray-600'}`}>
                        {fmt(k.sisa > 0 ? k.sisa : k.harga)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      {cd.expired ? (
                        <span className="text-red-600">Lewat {cd.days} hari</span>
                      ) : (
                        <span className="text-amber-700">
                          {cd.days > 0 && <>{cd.days}h </>}
                          {cd.hours}j {cd.minutes}m
                        </span>
                      )}
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{formatDate(cd.deadline.toISOString()).split(',').slice(0, 2).join(',')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paid categories badge */}
          {paidItems.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {paidItems.map(k => (
                <span key={k.id} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                  <Check size={10} /> {k.nama} Lunas
                </span>
              ))}
            </div>
          )}

          <div className="bg-[#FFF9E5] rounded-md p-4 flex gap-3 items-start border border-yellow-100">
            <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-[13px] text-gray-700 leading-snug">
              <p className="font-bold mb-1">Yuk, buruan selesaikan pembayaranmu,</p>
              <p>Kami verifikasi pesananmu kurang dari 15 menit setelah pembayaran berhasil dan paling lambat 1x24 jam.</p>
            </div>
          </div>
        </div>

        {/* --- PEMBATAS 1 (TICKET CUTOUT) --- */}
        <div className="relative h-5 bg-white">
          <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
        </div>

        {/* --- BAGIAN 2: INFORMASI TRANSFER --- */}
        <div className="bg-white py-6 px-6">
          {firstKategori && (
            <div className="mb-4 bg-[#E8FAFF] rounded-md p-3 text-center border border-blue-100">
              <p className="text-[13px] text-gray-600 mb-1">Silakan bayar kategori:</p>
              <p className="text-[15px] font-bold text-[#0E6187]">{firstKategori.nama}</p>
            </div>
          )}

          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Tolong transfer ke</h2>
          
          <div className="flex justify-end mb-4">
            <span className="text-[13px] font-bold text-gray-800">
              {bankName} a.n {bankOwner}
            </span>
          </div>
          
          <div className="border-t border-gray-100 my-4"></div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[13px] font-bold text-gray-800 mb-0.5">No. rekening</p>
                <p className="text-[15px] font-bold text-red-500">{bankAccount}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankAccount, "rek")}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedField === "rek" ? "Tersalin" : "Salin"}
                <Copy size={14} className={copiedField === "rek" ? "text-green-500" : ""} />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-[13px] font-bold text-gray-800 mb-0.5">Total Pembayaran</p>
                <p className="text-[15px] font-bold text-red-500">{fmt(totalBayar)}</p>
              </div>
              <button
                onClick={() => copyToClipboard(String(totalBayar).replace(/[^0-9]/g, ""), "nominal")}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedField === "nominal" ? "Tersalin" : "Salin"}
                <Copy size={14} className={copiedField === "nominal" ? "text-green-500" : ""} />
              </button>
            </div>
          </div>

          <div className="mt-6 bg-[#E8FAFF] rounded-md p-3 text-center text-[12px] text-gray-700 leading-relaxed">
            <span className="font-bold">Penting!</span> Mohon transfer sampai 3 digit terakhir yaitu{" "}
            <span className="font-bold text-red-500">{fmt(totalBayar)}</span> Karena sistem kami tidak bisa mengenali pembayaranmu bila jumlahnya tidak sesuai
          </div>
        </div>

        {/* --- PEMBATAS 2 (TICKET CUTOUT) --- */}
        <div className="relative h-5 bg-white">
          <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2"></div>
        </div>

        {/* --- BAGIAN 3: DETAIL & KONFIRMASI --- */}
        <div className="bg-white rounded-b-2xl py-6 px-6">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-gray-800 mb-5"
          >
            Lihat Detail Pesanan 
            {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetail && (
            <div className="mb-4 text-[13px] space-y-2 text-gray-600 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between">
                <span>Nama:</span>
                <span className="font-medium text-gray-800">{data.pendaftar.nama}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium text-gray-800">{data.pendaftar.email}</span>
              </div>
              {data.keuangan.diskon > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon:</span>
                  <span>-{fmt(data.keuangan.diskon)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-start mb-6 text-[13px]">
            <div className="text-gray-800">
              <p>Invoice ID: {data.no_invoice}</p>
              <p className="mt-0.5">{data.product?.nama || "-"}</p>
              {firstKategori && (
                <p className="mt-0.5 text-[#0E6187] font-semibold">{firstKategori.nama} — {fmt(firstKategori.harga)}</p>
              )}
              {data.kategori_items && data.kategori_items.length > 1 && (
                <p className="text-[11px] text-gray-400 mt-0.5">{data.kategori_items.length} kategori pembayaran</p>
              )}
            </div>
            <div className="text-gray-800 font-medium">
              {fmt(firstKategori ? firstKategori.harga : data.keuangan.harga_produk)}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 text-[13px] font-bold text-gray-800">
            <span>Total Pembayaran</span>
            <span>{fmt(totalBayar)}</span>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] text-gray-500 max-w-[150px] leading-snug">
              Konfirmasi pembayaran melalui halaman ini:
            </span>
            <a
              href={`/konfirmasi-pembayaran/${data.pendaftar.id}`}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-2.5 px-6 rounded-md text-[13px] transition-colors whitespace-nowrap"
            >
              KONFIRMASI
            </a>
          </div>
        </div>

        {/* --- FOOTER AMAN --- */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white text-[12px] opacity-90">
          <ShieldCheck size={16} className="text-[#00D166]" />
          <span>Informasi Pribadi Anda Aman</span>
        </div>

      </div>
    </div>
  );
}