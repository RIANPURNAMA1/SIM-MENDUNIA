import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { productApi, pendaftarApi, couponApi } from "../../services/api";
import {
  User,
  Loader,
  Shield,
} from "lucide-react";

interface KategoriItem {
  name: string;
  harga: number;
  komisi: number;
  children: KategoriItem[];
}

interface Product {
  id: number;
  nama: string;
  slug: string;
  deskripsi: string | null;
  harga: number;
  status: string;
  batch_id?: number | null;
  batch?: { id: number; nama_batch: string } | null;
  kategori_items?: KategoriItem[];
  biaya_kategoris?: { id: number; kode: string; pivot: { harga: number } }[];
}

export default function DaftarProgram() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telepon, setTelepon] = useState("");
  const [kodeKupon, setKodeKupon] = useState("");
  const [validasiKupon, setValidasiKupon] = useState<{
    valid: boolean;
    diskon?: number;
    nominal_setelah_diskon?: number;
    message?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function getFlattenedItems(items: KategoriItem[], parentOnly = false): { item: KategoriItem; depth: number }[] {
    const result: { item: KategoriItem; depth: number }[] = [];
    function walk(list: KategoriItem[], depth: number) {
      for (const item of list) {
        if (item.harga > 0) {
          result.push({ item, depth });
        }
        if (!parentOnly && item.children?.length) walk(item.children, depth + 1);
      }
    }
    walk(items, 0);
    return result;
  }

  const selectedTotal = (() => {
    if (!selectedProduct?.kategori_items?.length) return selectedProduct?.harga || 0;
    const flat = getFlattenedItems(selectedProduct.kategori_items, true);
    if (flat.length === 0) return 0;
    return flat[0].item.harga || 0;
  })();

  const totalDisplay = (() => {
    if (validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined) {
      return validasiKupon.nominal_setelah_diskon;
    }
    return selectedTotal;
  })();

  useEffect(() => {
    productApi.list().then((prodRes) => {
      const active = prodRes.data.filter((p: Product) => p.status !== "nonaktif");
      setProducts(active);
      if (slug) {
        const found = active.find((p: Product) => p.slug === slug);
        if (found) setSelectedProduct(found);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  async function cekKupon() {
    if (!kodeKupon || !selectedProduct) return;
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: selectedProduct.id,
        nominal: selectedTotal,
      });
      setValidasiKupon(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Kupon tidak valid";
      setValidasiKupon({ valid: false, message: msg });
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError("");

    const errors: Record<string, string> = {};
    if (!nama.trim()) errors.nama = "Nama lengkap wajib diisi";
    if (!email.trim()) errors.email = "Alamat email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid";
    if (!password) errors.password = "Password wajib diisi";
    else if (password.length < 6) errors.password = "Password minimal 6 karakter";
    if (!telepon.trim()) errors.telepon = "Nomor WhatsApp wajib diisi";
    else if (!/^[0-9]+$/.test(telepon.replace(/[\s\-+()]/g, ""))) errors.telepon = "Nomor WhatsApp hanya boleh berisi angka";
    setFieldErrors(errors);
    setTouched({ nama: true, email: true, password: true, telepon: true });
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("product_id", String(selectedProduct.id));
      if (kodeKupon) formData.append("kode_kupon", kodeKupon);
      formData.append("nama", nama);
      formData.append("email", email);
      formData.append("password", password);
      if (telepon) formData.append("telepon", telepon);
      if (selectedProduct.batch_id) formData.append("batch_id", String(selectedProduct.batch_id));
      if (selectedProduct.kategori_items?.length) {
        const flat = getFlattenedItems(selectedProduct.kategori_items, true);
        if (flat.length > 0) {
          formData.append("selected_kategori_items", JSON.stringify([flat[0].item.name]));
        }
      }

      const res = await pendaftarApi.daftarLangsung(formData);
      const pendaftarId = res.data?.id;
      window.location.href = `/checkout-berhasil/${pendaftarId}`;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Terjadi kesalahan, silakan coba lagi";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  function validateField(name: string, value: string) {
    let msg = "";
    if (name === "nama" && !value.trim()) msg = "Nama lengkap wajib diisi";
    else if (name === "email") {
      if (!value.trim()) msg = "Alamat email wajib diisi";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Format email tidak valid";
    } else if (name === "password") {
      if (!value) msg = "Password wajib diisi";
      else if (value.length < 6) msg = "Password minimal 6 karakter";
    } else if (name === "telepon") {
      if (!value.trim()) msg = "Nomor WhatsApp wajib diisi";
      else if (!/^[0-9]+$/.test(value.replace(/[\s\-+()]/g, ""))) msg = "Nomor WhatsApp hanya boleh berisi angka";
    }
    setFieldErrors(prev => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
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

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Program tidak ditemukan</p>
          <a href="/" className="text-sm text-blue-600 mt-2 inline-block hover:underline">Kembali ke Beranda</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E6187]">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo-sm.png" alt="Mendunia" className="w-6 md:w-7 h-6 md:h-7" />
            <span className="text-base md:text-xl font-bold text-gray-900 tracking-tight">Mendunia.id</span>
          </a>
          <a href="/login" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
            <span className="hidden sm:inline">Masuk</span>
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Detail Pesanan */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Detail Pesanan</h2>

              <div className="pb-4 mb-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 leading-snug">{selectedProduct.nama}</p>
                {selectedProduct.batch && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0E6187] bg-[#E8FAFF] px-2 py-0.5 rounded-full mt-1 border border-[#0E6187]/20">
                    {selectedProduct.batch.nama_batch}
                  </span>
                )}
                <p className="text-lg font-bold text-[#0E6187] mt-1">{fmt(selectedTotal)}</p>
              </div>

              <div className="space-y-3 pb-4 mb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya Transaksi</span>
                  <span className="font-medium text-gray-800">Rp 0</span>
                </div>
                {validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon</span>
                    <span>-{fmt(selectedTotal - validasiKupon.nominal_setelah_diskon)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-[#0E6187]">{fmt(totalDisplay)}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Shield size={14} className="text-green-600" />
                <span>Secure 100%</span>
              </div>
            </div>

            {/* Voucher Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Voucher Diskon</h3>
              <p className="text-xs text-gray-500 mb-3">Masukkan kode diskon jika memilikinya</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kodeKupon}
                  onChange={(e) => { setKodeKupon(e.target.value.toUpperCase()); setValidasiKupon(null); }}
                  placeholder="Masukkan disini kode diskonnya"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={cekKupon}
                  disabled={!kodeKupon}
                  className="px-4 py-2 bg-[#0E6187] text-white rounded text-sm font-medium hover:bg-[#1a5e6f] disabled:opacity-50 transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {validasiKupon && (
                <div className={`mt-2 p-2 rounded text-xs ${validasiKupon.valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {validasiKupon.valid
                    ? `Berhasil! Total: ${fmt(validasiKupon.nominal_setelah_diskon || 0)}`
                    : validasiKupon.message}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Form Pendaftaran */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">
                  Sudah mempunyai akun?{" "}
                  <a href="/login" className="text-[#0E6187] font-semibold hover:underline">Login</a>
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-2">Buat Akun Baru</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Isi data-data di bawah untuk bisa mengakses member area serta informasi terkait pembelian.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => { setNama(e.target.value); if (touched.nama) validateField("nama", e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, nama: true })); validateField("nama", nama); }}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.nama ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0E6187]"}`}
                  />
                  {fieldErrors.nama ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.nama}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Masukkan nama lengkap untuk kemudahan jika suatu saat diperlukan pencarian data.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField("email", e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, email: true })); validateField("email", email); }}
                    placeholder="Alamat Email"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0E6187]"}`}
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Kami mengirimkan informasi akses dan transaksi pembelian ke alamat email ini.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Buat Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField("password", e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, password: true })); validateField("password", password); }}
                    placeholder="Buat Password"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0E6187]"}`}
                  />
                  {fieldErrors.password ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Tuliskan password yang akan digunakan untuk website ini. Pastikan untuk menyimpan atau mengingat password yang ditulis.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => { setTelepon(e.target.value); if (touched.telepon) validateField("telepon", e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, telepon: true })); validateField("telepon", telepon); }}
                    placeholder="08123456789"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.telepon ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0E6187]"}`}
                  />
                  {fieldErrors.telepon ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.telepon}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Masukkan nomor WhatsApp aktif untuk notifikasi transaksi.
                    </p>
                  )}
                </div>

                {/* Ringkasan Pembayaran */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Ringkasan Pembayaran</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Bayar</span>
                    <span className="text-lg font-bold text-[#0E6187]">{fmt(totalDisplay)}</span>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 text-[#0E6187] border-gray-300 rounded focus:ring-[#0E6187] mt-0.5 shrink-0"
                  />
                  <span className="leading-relaxed">
                    Saya menyetujui syarat & ketentuan Mendunia dan memastikan data benar.
                  </span>
                </label>

                <p className="text-xs text-emerald-600 text-center flex items-center justify-center gap-1">
                  <Shield size={12} /> Informasi Pribadi Anda Aman di sini
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-[#42b72a] text-white rounded-lg text-sm font-bold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader size={16} className="animate-spin" /> Memproses...</>
                  ) : (
                    "Daftar Program"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
