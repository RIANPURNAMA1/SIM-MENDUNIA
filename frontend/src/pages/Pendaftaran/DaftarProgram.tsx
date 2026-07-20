import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import api, { productApi, pendaftarApi, couponApi, batchApi } from "../../services/api";
import {
  GraduationCap,
  ChevronRight,
  CheckCircle,
  User,
  Home,
  LogIn,
  Loader,
  Tag,
  FileText,
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
  kategori_items?: KategoriItem[];
  biaya_kategoris?: { id: number; kode: string; pivot: { harga: number } }[];
}

interface BiayaKategori {
  id: number;
  kode: string;
  nama: string;
  urutan: number;
}

interface Batch {
  id: number;
  nama_batch: string;
  kuota: number | null;
  siswas_count?: number;
  is_penuh?: boolean;
}

const steps = [
  { id: 1, label: "Data Diri", desc: "Informasi dasar pendaftar" },
  { id: 2, label: "Kontak", desc: "Informasi komunikasi" },
  { id: 3, label: "Ringkasan", desc: "Konfirmasi pendaftaran" },
];

export default function DaftarProgram() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
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
  const [successInfo, setSuccessInfo] = useState<{ noRegistrasi: string; invoiceUrl: string; pendaftarId?: number } | null>(null);
  const [biayaKategoris, setBiayaKategoris] = useState<BiayaKategori[]>([]);

  const [provinsi, setProvinsi] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [desa, setDesa] = useState("");
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

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

  useEffect(() => {
    Promise.all([
      productApi.list(),
      api.get('/biaya-kategori-flat'),
    ])
      .then(([prodRes, katRes]) => {
        const active = prodRes.data.filter((p: Product) => p.status !== "nonaktif");
        setProducts(active);
        const kats = (katRes.data || []).sort((a: BiayaKategori, b: BiayaKategori) => a.urutan - b.urutan);
        setBiayaKategoris(kats);
        if (slug) {
          const found = active.find((p: Product) => p.slug === slug);
          if (found) {
            setSelectedProduct(found);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    batchApi.list().then(res => setBatches(res.data.data || [])).catch(() => {})
  }, [])

  const totalDisplay = (() => {
    if (validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined) {
      return validasiKupon.nominal_setelah_diskon;
    }
    return selectedTotal;
  })()

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => setProvinces(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinsi) { setRegencies([]); setKabupaten(""); setDistricts([]); setKecamatan(""); setVillages([]); setDesa(""); return; }
    setLoadingRegencies(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsi}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setRegencies(data); setLoadingRegencies(false); })
      .catch(() => setLoadingRegencies(false));
  }, [provinsi]);

  useEffect(() => {
    if (!kabupaten) { setDistricts([]); setKecamatan(""); setVillages([]); setDesa(""); return; }
    setLoadingDistricts(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabupaten}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setDistricts(data); setLoadingDistricts(false); })
      .catch(() => setLoadingDistricts(false));
  }, [kabupaten]);

  useEffect(() => {
    if (!kecamatan) { setVillages([]); setDesa(""); return; }
    setLoadingVillages(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatan}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setVillages(data); setLoadingVillages(false); })
      .catch(() => setLoadingVillages(false));
  }, [kecamatan]);

  async function cekKupon() {
    if (!kodeKupon || !selectedProduct) return;
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: selectedProduct.id,
        nominal: Number(nominal || selectedTotal),
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
    if (selectedProduct.kategori_items?.length && selectedTotal <= 0) {
      setError("Pilih minimal satu kategori pembayaran");
      setIsSubmitting(false);
      return;
    }
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
      if (provinsi) formData.append("provinsi", provinces.find(p => p.id === provinsi)?.name || provinsi);
      if (kabupaten) formData.append("kabupaten", regencies.find(r => r.id === kabupaten)?.name || kabupaten);
      if (kecamatan) formData.append("kecamatan", districts.find(d => d.id === kecamatan)?.name || kecamatan);
      if (desa) formData.append("desa", villages.find(v => v.id === desa)?.name || desa);
      if (batchId) formData.append("batch_id", batchId);
      if (selectedProduct.kategori_items?.length) {
        const flat = getFlattenedItems(selectedProduct.kategori_items, true);
        if (flat.length > 0) {
          formData.append("selected_kategori_items", JSON.stringify([flat[0].item.name]));
        }
      }

      const res = await pendaftarApi.daftarLangsung(formData);
      const noReg = res.data?.no_registrasi || res.data?.noRegistrasi || '-'
      const invoiceUrl = res.data?.invoice_url || `/pendaftar/${res.data?.id}/invoice`
      const pendaftarId = res.data?.id
      setSuccessInfo({ noRegistrasi: noReg, invoiceUrl, pendaftarId })
      setSuccess(true)
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
    if (step === 2 && (!telepon || !alamat)) {
      setError("Harap isi Nomor Telepon dan Alamat Lengkap");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, 3));
  }

  const Navbar = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo-sm.png" alt="Mendunia" className="w-6 md:w-7 h-6 md:h-7" />
          <span className="text-base md:text-xl font-bold text-gray-900 tracking-tight">
            Mendunia.id
          </span>
        </a>

        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <User size={13} className="text-gray-500" />
            </div>
            <span className="hidden xs:inline">Masuk</span>
          </a>
        </div>
      </div>
    </nav>
  );

  // --- Registration Form View ---
  const LoadingScreen = () => (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
        <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
      </div>
    </div>
  )

  if (slug) {
    if (loading) {
      return <LoadingScreen />;
    }

    if (!selectedProduct) {
      // ... (Keep existing not found view, just update colors if desired) ...
      return <div className="p-8 text-center">Program tidak ditemukan</div>;
    }

    if (success) {
      return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-8 max-w-md w-full text-center fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1c1e21] mb-2">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-[#606770] mb-6">Data pendaftaran Anda telah tersimpan.</p>
            <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 text-left mb-6">
              <p className="text-xs text-gray-500 mb-1">Nomor Invoice</p>
              <p className="text-sm font-mono font-bold text-gray-900">{successInfo?.noRegistrasi || '-'}</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Sistem telah mengirim notifikasi WhatsApp berisi tautan pembayaran. Silakan cek WhatsApp Anda untuk menyelesaikan pembayaran.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={`/bayar/${successInfo?.pendaftarId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0D1F3C] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2d4a] transition-colors"
              >
                <FileText size={16} /> Bayar Sekarang
              </a>
              <a
                href={successInfo?.invoiceUrl || '#'}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Lihat Invoice
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f0f2f5] text-gray-800">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 fade-in">
          <div className="mb-6 md:mb-8">
            <h1 className="text-base md:text-xl font-bold text-gray-900">
              Daftar Program
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2 leading-relaxed">
              Isi data diri dan selesaikan pembayaran untuk mendaftar program pilihan Anda.
            </p>
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex items-center justify-between gap-3 shadow-sm animate-slide-down">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center shrink-0">
                  <GraduationCap size={16} className="text-[#0D1F3C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-gray-500 font-medium">
                    Program
                  </p>
                  <p className="text-xs md:text-sm font-bold text-gray-900 truncate">
                    {selectedProduct?.nama}
                  </p>
                </div>
              </div>
              <p className="text-sm md:text-lg font-bold text-[#0D1F3C] shrink-0">
                Rp {Number(selectedProduct?.kategori_items?.length ? selectedTotal : (selectedProduct?.harga || 0)).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12">
            {/* LEFT SIDEBAR: Stepper & Contact Card — hidden on mobile */}
            <div className="hidden md:block w-full md:w-1/4 flex-shrink-0 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="relative">
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
            </div>

            {/* RIGHT MAIN CONTENT: Form Area */}
            <div className="w-full md:w-3/4 fade-in" style={{ animationDelay: '0.2s' }}>
              {/* Mobile horizontal stepper */}
              <div className="md:hidden mb-4">
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  {steps.map((s, i) => {
                    const isActive = step === s.id;
                    const isPassed = step > s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-1.5 flex-1">
                        {i > 0 && (
                          <div className={`h-0.5 flex-1 ${isPassed || isActive ? 'bg-[#0D1F3C]' : 'bg-gray-200'}`} />
                        )}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${
                              isActive
                                ? "bg-[#0D1F3C] border-[#0D1F3C] text-white"
                                : isPassed
                                  ? "bg-[#e8eaf0] border-[#e8eaf0] text-[#0D1F3C]"
                                  : "bg-white border-gray-300 text-gray-400"
                            }`}
                          >
                            {isPassed ? <CheckCircle size={10} /> : s.id}
                          </div>
                          <span className={`text-[9px] mt-1 leading-tight text-center ${isActive ? 'text-[#0D1F3C] font-semibold' : isPassed ? 'text-[#0D1F3C]' : 'text-gray-400'}`}>
                            {s.label}
                          </span>
                        </div>
                        {i === steps.length - 1 && <div className="h-0.5 flex-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Header Section */}
                <div className="px-4 md:px-8 py-4 md:py-5 border-b border-gray-200">
                  <h2 className="text-base md:text-xl text-gray-800 font-medium">
                    {step}. {steps[step - 1].label}
                  </h2>
                </div>

                {/* Form Content */}
                <div className="p-4 md:p-8 fade-in" key={step}>
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={
                      step === 3
                        ? handleSubmit
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

                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            1. Informasi Dasar
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Nama Lengkap</label>
                              <input
                                type="text"
                                required
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                placeholder="Nama Lengkap"
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Password</label>
                              <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                placeholder="Password (Min. 6 Karakter)"
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Email Aktif</label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Alamat Email Aktif"
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>

                          <div className="mt-5 pt-5 border-t border-gray-200">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Pilih Batch <span className="text-gray-400 font-normal">(opsional)</span></label>
                            <select
                              value={batchId}
                              onChange={(e) => setBatchId(e.target.value)}
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
                            >
                              <option value="">Belum ditentukan</option>
                              {batches.map((b) => {
                                const penuh = b.is_penuh && b.kuota !== null && (b.siswas_count ?? 0) >= b.kuota
                                return (
                                  <option key={b.id} value={b.id} disabled={penuh}>
                                    {b.nama_batch}{penuh ? ` (Penuh)` : b.kuota ? ` (${b.siswas_count ?? 0}/${b.kuota})` : ''}
                                  </option>
                                )
                              })}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1.5">Opsional — admin dapat menentukan batch nanti</p>
                            {batchId && (() => {
                              const selectedBatch = batches.find(b => String(b.id) === batchId)
                              if (selectedBatch?.is_penuh) {
                                return (
                                  <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                    Kelas ini sudah penuh. Silakan pilih batch lain.
                                  </p>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8">
                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            2. Detail Kontak
                          </h4>

                          <div className="space-y-3 md:space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Nomor WhatsApp <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                required
                                value={telepon}
                                onChange={(e) => setTelepon(e.target.value)}
                                placeholder="08123456789"
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                              <textarea
                                required
                                value={alamat}
                                onChange={(e) => setAlamat(e.target.value)}
                                placeholder="Alamat Lengkap"
                                rows={3}
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                                <select
                                  value={provinsi}
                                  onChange={(e) => { setProvinsi(e.target.value); setKabupaten(""); setKecamatan(""); setDesa(""); }}
                                  className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                                >
                                  <option value="">Pilih Provinsi</option>
                                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Kabupaten / Kota</label>
                                <select
                                  value={kabupaten}
                                  onChange={(e) => { setKabupaten(e.target.value); setKecamatan(""); setDesa(""); }}
                                  disabled={!provinsi || loadingRegencies}
                                  className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">{loadingRegencies ? 'Memuat...' : 'Pilih Kabupaten'}</option>
                                  {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Kecamatan</label>
                                <select
                                  value={kecamatan}
                                  onChange={(e) => { setKecamatan(e.target.value); setDesa(""); }}
                                  disabled={!kabupaten || loadingDistricts}
                                  className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">{loadingDistricts ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Desa / Kelurahan</label>
                                <select
                                  value={desa}
                                  onChange={(e) => setDesa(e.target.value)}
                                  disabled={!kecamatan || loadingVillages}
                                  className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">{loadingVillages ? 'Memuat...' : 'Pilih Desa'}</option>
                                  {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8">
                        <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                            3. Ringkasan Pendaftaran
                          </h4>

                          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white border border-gray-200 rounded text-sm">
                            <p className="text-gray-500 mb-1">
                              Program yang dipilih:
                            </p>
                            <p className="font-semibold text-gray-900">
                              {selectedProduct.nama}
                            </p>

                            {selectedProduct.kategori_items && selectedProduct.kategori_items.length > 0 && (() => {
                              const flat = getFlattenedItems(selectedProduct.kategori_items, true);
                              if (flat.length === 0) return null;
                              const firstItem = flat[0];
                              return (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Kategori Pembayaran:</p>
                                  <div className="space-y-1.5">
                                    <div
                                      className="flex items-center gap-2.5 py-1.5 px-2.5 rounded bg-blue-50 border border-blue-200"
                                    >
                                      <span className="text-xs font-medium text-gray-700">{firstItem.item.name}</span>
                                      <span className="ml-auto text-xs font-bold text-gray-900">
                                        Rp {Number(firstItem.item.harga).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  </div>
                                  {flat.length > 1 && (
                                    <p className="text-[11px] text-gray-400 mt-2">Pembayaran tahapan lainnya dilakukan setelah pendaftaran</p>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <span className="text-xs font-semibold text-gray-700">Total yang harus dibayar</span>
                              <p className="font-bold text-base md:text-lg text-[#0D1F3C]">
                                Rp {Number(totalDisplay).toLocaleString("id-ID")}
                              </p>
                            </div>
                            {validasiKupon?.valid && (
                              <p className="text-[11px] text-green-600 mt-1">
                                Kupon diterapkan: Hemat Rp {Number(selectedTotal - (validasiKupon.nominal_setelah_diskon || 0)).toLocaleString("id-ID")}
                              </p>
                            )}
                          </div>

                          <div className="mb-4 md:mb-6">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Kode Kupon (Opsional)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={kodeKupon}
                                onChange={(e) => {
                                  setKodeKupon(e.target.value.toUpperCase());
                                  setValidasiKupon(null);
                                }}
                                placeholder="Masukkan kode kupon"
                                className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm font-mono"
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
                                  ? `Total setelah kupon: Rp ${Number(validasiKupon.nominal_setelah_diskon).toLocaleString("id-ID")}`
                                  : validasiKupon.message}
                              </div>
                            )}
                          </div>

                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
                            <div className="flex items-start gap-2.5 md:gap-3">
                              <Tag size={14} className="text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs md:text-sm font-semibold text-amber-800">Cara Pembayaran</p>
                                <p className="text-[11px] md:text-xs text-amber-700 mt-1 leading-relaxed">
                                  Setelah menekan tombol <strong>Daftar</strong>, sistem akan membuat Nomor Invoice dan mengirimkan notifikasi WhatsApp berisi tautan pembayaran ke nomor telepon Anda. Silakan cek WhatsApp untuk menyelesaikan pembayaran.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Area */}
                    <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4">
                      {step === 3 && (
                        <label className="flex items-start gap-2 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            required
                            className="w-4 h-4 text-[#0D1F3C] border-gray-300 rounded focus:ring-[#0D1F3C] mt-0.5 shrink-0"
                          />
                          <span className="leading-relaxed">
                            Saya menyetujui syarat & ketentuan Mendunia dan
                            memastikan data benar.
                          </span>
                        </label>
                      )}

                      <div className="flex gap-3">
                        {step > 1 && (
                          <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 px-4 py-3 md:py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Kembali
                          </button>
                        )}
                        {step < 3 ? (
                          <button
                            type="submit"
                            className="flex-1 px-6 py-3 md:py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors flex items-center justify-center gap-2"
                          >
                            Selanjutnya
                            <ChevronRight size={16} />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 md:py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <><Loader size={16} className="animate-spin" /> Mendaftarkan...</>
                            ) : (
                              <><FileText size={16} /> Daftar</>
                            )}
                          </button>
                        )}
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
                    href={`/daftar-program/${product.slug}`}
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
