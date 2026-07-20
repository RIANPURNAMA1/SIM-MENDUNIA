import { useState, useEffect } from "react";
import { Loader, CheckCircle, User, ChevronRight, FileText, Tag } from "lucide-react";
import { authApi } from "../../services/api";

const steps = [
  { id: 1, label: "Data Diri", desc: "Informasi dasar pendaftar" },
  { id: 2, label: "Kontak & Wilayah", desc: "Informasi komunikasi & lokasi" },
  { id: 3, label: "Rekening & Ringkasan", desc: "Data rekening & konfirmasi" },
];

export default function DaftarAffiliateBaru() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [desa, setDesa] = useState("");
  const [namaRekening, setNamaRekening] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [bank, setBank] = useState("");

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const bankOptions = [
    "BCA", "BRI", "BNI", "Mandiri", "BTN", "BSI", "CIMB Niaga",
    "Danamon", "Permata", "Maybank", "OCBC NISP", "BNI Syariah",
    "BRI Syariah", "Mandiri Syariah", "BSI", "Panin Bank", "Bukopin",
    "Sinarmas", "Muamalat", "Victoria", "BTN Syariah", "Lainnya",
  ];

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => setProvinces(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinsi) {
      setRegencies([]);
      setKabupaten("");
      setDistricts([]);
      setKecamatan("");
      setVillages([]);
      setDesa("");
      return;
    }
    setLoadingRegencies(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsi}.json`)
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => {
        setRegencies(data);
        setLoadingRegencies(false);
      })
      .catch(() => setLoadingRegencies(false));
  }, [provinsi]);

  useEffect(() => {
    if (!kabupaten) {
      setDistricts([]);
      setKecamatan("");
      setVillages([]);
      setDesa("");
      return;
    }
    setLoadingDistricts(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabupaten}.json`)
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => {
        setDistricts(data);
        setLoadingDistricts(false);
      })
      .catch(() => setLoadingDistricts(false));
  }, [kabupaten]);

  useEffect(() => {
    if (!kecamatan) {
      setVillages([]);
      setDesa("");
      return;
    }
    setLoadingVillages(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatan}.json`)
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => {
        setVillages(data);
        setLoadingVillages(false);
      })
      .catch(() => setLoadingVillages(false));
  }, [kecamatan]);

  function nextStep() {
    if (step === 1 && (!name || !email || !password)) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await authApi.registerAffiliate({
        name,
        email,
        password,
        telepon,
        alamat,
        provinsi: provinces.find((p) => p.id === provinsi)?.name || null,
        kabupaten: regencies.find((r) => r.id === kabupaten)?.name || null,
        kecamatan: districts.find((d) => d.id === kecamatan)?.name || null,
        desa: villages.find((v) => v.id === desa)?.name || null,
        nama_rekening: namaRekening || null,
        no_rekening: noRekening || null,
        bank: bank || null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-8 max-w-md w-full text-center fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-[#1c1e21] mb-2">Pendaftaran Berhasil!</h1>
          <p className="text-sm text-[#606770] mb-6">Akun affiliate Anda telah dibuat.</p>
          <a
            href="/affiliate-dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0D1F3C] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2d4a] transition-colors"
          >
            <FileText size={16} /> Menuju Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800">
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

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 fade-in">
        <div className="mb-6 md:mb-8">
          <h1 className="text-base md:text-xl font-bold text-gray-900">Daftar Affiliate</h1>
          <p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2 leading-relaxed">
            Bergabung jadi affiliate dan dapatkan komisi dari setiap pendaftaran.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <div className="hidden md:block w-full md:w-1/4 flex-shrink-0 fade-in" style={{ animationDelay: "0.1s" }}>
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
                        <p className={`text-sm font-semibold ${isActive || isPassed ? "text-[#0D1F3C]" : "text-gray-400"}`}>
                          {s.label}
                        </p>
                        {(isActive || isPassed) && (
                          <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full md:w-3/4 fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                {steps.map((s, i) => {
                  const isActive = step === s.id;
                  const isPassed = step > s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-1.5 flex-1">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${isPassed || isActive ? "bg-[#0D1F3C]" : "bg-gray-200"}`} />
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
                        <span className={`text-[9px] mt-1 leading-tight text-center ${isActive ? "text-[#0D1F3C] font-semibold" : isPassed ? "text-[#0D1F3C]" : "text-gray-400"}`}>
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
              <div className="px-4 md:px-8 py-4 md:py-5 border-b border-gray-200">
                <h2 className="text-base md:text-xl text-gray-800 font-medium">
                  {step}. {steps[step - 1].label}
                </h2>
              </div>

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
                          <h3 className="text-base font-semibold text-gray-800">Data Pendaftar</h3>
                          <p className="text-sm text-gray-500">Silakan isi informasi dasar pendaftar di bawah ini.</p>
                        </div>
                      </div>

                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">1. Informasi Dasar</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="sr-only">Nama Lengkap</label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
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
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">2. Kontak & Wilayah</h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nomor WhatsApp <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={telepon}
                              onChange={(e) => setTelepon(e.target.value)}
                              placeholder="08123456789"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alamat Lengkap <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              required
                              value={alamat}
                              onChange={(e) => setAlamat(e.target.value)}
                              placeholder="Alamat Lengkap"
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                              <select
                                value={provinsi}
                                onChange={(e) => {
                                  setProvinsi(e.target.value);
                                  setKabupaten("");
                                  setKecamatan("");
                                  setDesa("");
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                              >
                                <option value="">Pilih Provinsi</option>
                                {provinces.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten / Kota</label>
                              <select
                                value={kabupaten}
                                onChange={(e) => {
                                  setKabupaten(e.target.value);
                                  setKecamatan("");
                                  setDesa("");
                                }}
                                disabled={!provinsi || loadingRegencies}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingRegencies ? "Memuat..." : "Pilih Kabupaten"}</option>
                                {regencies.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                              <select
                                value={kecamatan}
                                onChange={(e) => {
                                  setKecamatan(e.target.value);
                                  setDesa("");
                                }}
                                disabled={!kabupaten || loadingDistricts}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingDistricts ? "Memuat..." : "Pilih Kecamatan"}</option>
                                {districts.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Desa / Kelurahan</label>
                              <select
                                value={desa}
                                onChange={(e) => setDesa(e.target.value)}
                                disabled={!kecamatan || loadingVillages}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingVillages ? "Memuat..." : "Pilih Desa"}</option>
                                {villages.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">3. Rekening Bank</h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                            <input
                              type="text"
                              value={namaRekening}
                              onChange={(e) => setNamaRekening(e.target.value)}
                              placeholder="Nama sesuai rekening"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                            <input
                              type="text"
                              value={noRekening}
                              onChange={(e) => setNoRekening(e.target.value)}
                              placeholder="Nomor rekening"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                            <select
                              value={bank}
                              onChange={(e) => setBank(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
                            >
                              <option value="">Pilih Bank</option>
                              {bankOptions.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">Ringkasan Pendaftaran</h4>

                        <div className="p-4 bg-white border border-gray-200 rounded text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Nama</span>
                            <span className="font-semibold text-gray-900">{name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-semibold text-gray-900">{email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Telepon</span>
                            <span className="font-semibold text-gray-900">{telepon || "-"}</span>
                          </div>
                          {namaRekening && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Rekening</span>
                              <span className="font-semibold text-gray-900">
                                {bank} - {noRekening} ({namaRekening})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Tag size={16} className="text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-amber-800">Informasi</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Setelah mendaftar, Anda akan diarahkan ke dashboard affiliate untuk mulai membuat link referral.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="flex items-start gap-2 text-xs text-gray-500 flex-1">
                      {step === 3 && (
                        <>
                          <input
                            type="checkbox"
                            required
                            className="w-4 h-4 text-[#0D1F3C] border-gray-300 rounded focus:ring-[#0D1F3C] mt-0.5 shrink-0"
                          />
                          <span>
                            Saya menyetujui syarat & ketentuan Mendunia dan memastikan data benar.
                          </span>
                        </>
                      )}
                    </label>

                    <div className="flex gap-3 w-full sm:w-auto">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={() => setStep((s) => s - 1)}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Kembali
                        </button>
                      )}
                      {step < 3 ? (
                        <button
                          type="submit"
                          className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors flex items-center justify-center gap-2"
                        >
                          Selanjutnya
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader size={16} className="animate-spin" /> Mendaftarkan...
                            </>
                          ) : (
                            <>
                              <FileText size={16} /> Daftar
                            </>
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
