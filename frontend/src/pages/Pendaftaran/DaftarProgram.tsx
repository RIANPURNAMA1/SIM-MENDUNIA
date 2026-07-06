import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { productApi, pendaftarApi, couponApi } from "../../services/api";
import {
  GraduationCap,
  ChevronRight,
  CheckCircle,
  Loader,
  User,
  MessageCircle,
  Upload,
  Home,
  LogIn,
  FileText,
  X,
} from "lucide-react";

interface Product {
  id: number;
  nama: string;
  deskripsi: string | null;
  harga: number;
  status: string;
}

const steps = [
  { id: 1, label: "Data Diri", desc: "Informasi dasar pendaftar" },
  { id: 2, label: "Kontak", desc: "Informasi komunikasi" },
  { id: 3, label: "Pembayaran", desc: "Selesaikan transaksi" },
];

export default function DaftarProgram() {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [bukti, setBukti] = useState<File | null>(null);
  const [kodeKupon, setKodeKupon] = useState("");
  const [validasiKupon, setValidasiKupon] = useState<{
    valid: boolean;
    diskon?: number;
    nominal_setelah_diskon?: number;
    message?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    productApi
      .list()
      .then((res) => {
        const active = res.data.filter((p: Product) => p.status !== "nonaktif");
        setProducts(active);
        if (id) {
          const found = active.find((p: Product) => String(p.id) === id);
          if (found) setSelectedProduct(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (bukti && bukti.type.startsWith("image/")) {
      const url = URL.createObjectURL(bukti);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [bukti]);

  async function cekKupon() {
    if (!kodeKupon || !selectedProduct) return;
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: selectedProduct.id,
        nominal: Number(selectedProduct.harga),
      });
      setValidasiKupon(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Kupon tidak valid";
      setValidasiKupon({ valid: false, message: msg });
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("product_id", String(selectedProduct.id));
      if (kodeKupon) formData.append("kode_kupon", kodeKupon);
      formData.append("nama", nama);
      formData.append("email", email);
      formData.append("password", password);
      if (telepon) formData.append("telepon", telepon);
      if (alamat) formData.append("alamat", alamat);
      formData.append("nominal", String(selectedProduct.harga));
      formData.append("bukti_pembayaran", bukti!);

      await pendaftarApi.daftarLangsung(formData);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Terjadi kesalahan, silakan coba lagi";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  function nextStep() {
    if (step === 1 && (!nama || !email || !password)) {
      setError("Harap isi Nama, Email, dan Password");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleFinalSubmit(e: FormEvent) {
    if (!bukti) {
      setError("Harap upload bukti pembayaran");
      return;
    }
    handleSubmit(e);
  }

  const Navbar = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            Mendunia.id
          </span>
        </a>

        {/* Right: User/Login */}
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <User size={16} className="text-gray-500" />
            </div>
            <span>Masuk</span>
          </a>
        </div>
      </div>
    </nav>
  );

  // --- Registration Form View ---
  const LoadingScreen = () => (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
        <img src="/logo-sm.png" alt="Mendunia" className="w-8 h-8" />
      </div>
    </div>
  )

  if (id) {
    if (loading) {
      return <LoadingScreen />;
    }

    if (!selectedProduct) {
      // ... (Keep existing not found view, just update colors if desired) ...
      return <div className="p-8 text-center">Program tidak ditemukan</div>;
    }

    if (success) {
      // ... (Keep existing success view) ...
      return (
        <div className="p-8 text-center text-green-600 font-bold">
          Pendaftaran Berhasil!
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f0f2f5] text-gray-800">
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              Daftar Program Di Mendunia.id
            </h1>
            <p className="text-gray-600 text-base mt-2 leading-relaxed">
              Temukan program pelatihan bahasa dan persiapan kerja terbaik untuk
              mewujudkan impian karir global Anda.
            </p>
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm animate-slide-down">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
                  <GraduationCap size={20} className="text-[#0D1F3C]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    Program Dipilih
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedProduct?.nama}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-[#0D1F3C]">
                Rp {Number(selectedProduct?.harga || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12">
            {/* LEFT SIDEBAR: Stepper & Contact Card */}
            <div className="w-full md:w-1/4 flex-shrink-0 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200 -z-10"></div>

                <div className="space-y-6">
                  {steps.map((s) => {
                    const isActive = step === s.id;
                    const isPassed = step > s.id;
                    return (
                      <div key={s.id} className="flex gap-4">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold border-2 z-10 ${
                            isActive
                              ? "bg-[#0D1F3C] border-[#0D1F3C] text-white"
                              : isPassed
                                ? "bg-[#e8eaf0] border-[#e8eaf0] text-[#0D1F3C]"
                                : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {isPassed ? <CheckCircle size={14} /> : s.id}
                        </div>
                        <div className="pt-0.5">
                          <p
                            className={`text-sm font-semibold ${isActive || isPassed ? "text-[#0D1F3C]" : "text-gray-400"}`}
                          >
                            {s.label}
                          </p>
                          {(isActive || isPassed) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {s.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Help Card */}
              <div className="mt-12 bg-white border border-gray-200 rounded-lg p-5 shadow-sm fade-in" style={{ animationDelay: '0.15s' }}>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                  BUTUH BANTUAN?
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  Tulis pesan kepada kami dan kami akan menyelesaikannya
                </p>
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#eef1f6] text-[#0D1F3C] rounded-md text-sm font-semibold hover:bg-[#e4e7ec] transition-colors">
                  <MessageCircle size={16} /> HUBUNGI KAMI
                </button>
              </div>
            </div>

            {/* RIGHT MAIN CONTENT: Form Area */}
            <div className="w-full md:w-3/4 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Header Section */}
                <div className="px-8 py-5 border-b border-gray-200">
                  <h2 className="text-xl text-gray-800 font-medium">
                    {step}. {steps[step - 1].label}
                  </h2>
                </div>

                {/* Form Content */}
                <div className="p-8 fade-in" key={step}>
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={
                      step === 3
                        ? handleFinalSubmit
                        : (e) => {
                            e.preventDefault();
                            nextStep();
                          }
                    }
                  >
                    {step === 1 && (
                      <div className="space-y-8">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#eef1f6] flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-[#0D1F3C]" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-800">
                              Data Pendaftar
                            </h3>
                            <p className="text-sm text-gray-500">
                              Silakan isi informasi dasar pendaftar di bawah
                              ini.
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            1. Informasi Dasar
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="sr-only">Nama Lengkap</label>
                              <input
                                type="text"
                                required
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                placeholder="Nama Lengkap"
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <label className="sr-only">Password</label>
                              <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                placeholder="Password (Min. 6 Karakter)"
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="sr-only">Email Aktif</label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Alamat Email Aktif"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8">
                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            2. Detail Kontak (Opsional)
                          </h4>

                          <div className="space-y-4">
                            <div>
                              <input
                                type="text"
                                value={telepon}
                                onChange={(e) => setTelepon(e.target.value)}
                                placeholder="Nomor Telepon (Contoh: 08123456789)"
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <textarea
                                value={alamat}
                                onChange={(e) => setAlamat(e.target.value)}
                                placeholder="Alamat Lengkap"
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8">
                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            3. Ringkasan & Pembayaran
                          </h4>

                          <div className="mb-6 p-4 bg-white border border-gray-200 rounded text-sm">
                            <p className="text-gray-500 mb-1">
                              Program yang dipilih:
                            </p>
                            <p className="font-semibold text-gray-900">
                              {selectedProduct.nama}
                            </p>
                            <p className="font-bold text-[#0D1F3C] mt-2">
                              Rp{" "}
                              {Number(selectedProduct.harga).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kode Kupon (Opsional)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={kodeKupon}
                                  onChange={(e) => {
                                    setKodeKupon(e.target.value.toUpperCase());
                                    setValidasiKupon(null);
                                  }}
                                  placeholder="Masukkan kode kupon"
                                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={cekKupon}
                                  disabled={!kodeKupon}
                                  className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded text-sm font-medium hover:bg-[#1a2d4a] disabled:opacity-50 transition-colors"
                                >
                                  Terapkan
                                </button>
                              </div>
                              {validasiKupon && (
                                <div
                                  className={`mt-2 p-3 rounded text-sm ${validasiKupon.valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                                >
                                  {validasiKupon.valid
                                    ? `Berhasil! Total Bayar: Rp ${Number(validasiKupon.nominal_setelah_diskon).toLocaleString("id-ID")}`
                                    : validasiKupon.message}
                                </div>
                              )}
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Bukti Pembayaran
                              </label>

                              {bukti && previewUrl ? (
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white mb-3">
                                  <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-48 object-contain bg-[#f7f8fa]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setBukti(null)}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : bukti && !previewUrl ? (
                                <div className="relative rounded-lg border border-gray-200 bg-white p-4 mb-3 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-none">
                                    <FileText size={20} className="text-red-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{bukti.name}</p>
                                    <p className="text-xs text-gray-500">PDF</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setBukti(null)}
                                    className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-none"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-500 font-semibold">
                                      {bukti ? "Ganti file" : "Klik untuk upload"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      .JPG, .PNG, atau .PDF
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    required
                                    onChange={(e) =>
                                      setBukti(e.target.files?.[0] || null)
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Area */}
                    <div className="mt-8 flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-gray-500 flex-1">
                        {step === 3 && (
                          <>
                            <input
                              type="checkbox"
                              required
                              className="w-4 h-4 text-[#0D1F3C] border-gray-300 rounded focus:ring-[#0D1F3C]"
                            />
                            <span>
                              Saya menyetujui syarat & ketentuan Mendunia dan
                              memastikan data benar.
                            </span>
                          </>
                        )}
                      </label>

                      <div className="flex gap-3">
                        {step > 1 && (
                          <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Kembali
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-8 py-3 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader size={16} className="animate-spin" />
                          ) : step === 3 ? (
                            "Kirim Pendaftaran"
                          ) : (
                            "Selanjutnya"
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Catalog View ---
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <img
            src="/logo-sm.png"
            alt="Mendunia"
            className="w-14 h-14 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#1c1e21] mb-2">
            Pilih Program
          </h1>
          <p className="text-[#606770]">
            Pilih program yang sesuai untuk Anda, lalu daftar sekarang.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#e4e6eb] rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} className="text-[#606770]" />
            </div>
            <p className="text-lg font-semibold text-[#1c1e21]">
              Belum ada program tersedia
            </p>
            <p className="text-sm text-[#606770] mt-1">
              Silakan cek kembali nanti
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-6 hover:shadow-[0_4px_8px_rgba(0,0,0,.15),0_12px_24px_rgba(0,0,0,.15)] transition-shadow"
              >
                <div className="w-12 h-12 bg-[#eef1f6] rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap size={22} className="text-[#0D1F3C]" />
                </div>
                <h3 className="text-lg font-bold text-[#1c1e21] mb-2">
                  {product.nama}
                </h3>
                {product.deskripsi && (
                  <p className="text-sm text-[#606770] mb-5 line-clamp-2 leading-relaxed">
                    {product.deskripsi}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-[#dadde1]">
                  <p className="text-xl font-bold text-[#0D1F3C]">
                    Rp {Number(product.harga).toLocaleString("id-ID")}
                  </p>
                  <a
                    href={`/daftar-program/${product.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-bold hover:bg-[#1a2d4a] transition-colors"
                  >
                    Daftar <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-xs text-[#606770]">
            &copy; 2026 Mendunia.id &middot; Sistem Manajemen SDM Terintegrasi
          </p>
        </div>
      </div>
    </div>
  );
}
