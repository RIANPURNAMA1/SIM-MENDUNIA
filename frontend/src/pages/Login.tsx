import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RefreshCw } from "lucide-react";

function generateCaptcha() {
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (captchaInput !== captcha) {
      setError("Kode captcha yang Anda masukkan salah");
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      const role = res?.data?.user?.role;
      if (role === "AFFILIATE") {
        window.location.href = "/affiliate-dashboard";
      } else if (role === "KANDIDAT") {
        window.location.href = "/siswa-dashboard";
      } else if (role === "GURU") {
        window.location.href = "/guru-dashboard";
      } else if (role === "MANAGER" || role === "HR" || role === "ADMIN") {
        window.location.href = "/";
      } else {
        window.location.href = "/dashboard-karyawan";
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Email atau password salah";
      setError(msg);
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] fade-in">
    
          <div className="p-8">
            <h1 className="text-2xl font-bold text-[#1c1e21] mb-1">Masuk</h1>
            <p className="text-sm text-[#606770] mb-6">Login untuk melanjutkan</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email atau Nama"
                className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] text-[#1c1e21] placeholder-[#8d949e]"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Kata Sandi"
                  className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] text-[#1c1e21] placeholder-[#8d949e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0D1F3C] hover:underline"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-none w-24 h-[52px] bg-[#f5f6f7] rounded-lg border border-[#dddfe2] flex items-center justify-center select-none relative overflow-hidden group">
                  <span className="text-lg font-black tracking-widest text-[#1c1e21]">{captcha}</span>
                  <button
                    type="button"
                    onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput("") }}
                    className="absolute inset-0 bg-[#0D1F3C]/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  placeholder="Kode verifikasi"
                  className="flex-1 h-[52px] px-3 text-[15px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] text-[#1c1e21] placeholder-[#8d949e]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 bg-[#0D1F3C] text-white font-bold text-[18px] py-3 rounded-lg hover:bg-[#1a2d4a] transition-colors flex justify-center items-center h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  "Masuk"
                )}
              </button>

              <div className="text-center">
                <a href="/forgot-password" className="text-sm text-[#0D1F3C] font-medium hover:underline">
                  Lupa kata sandi?
                </a>
              </div>

              <div className="border-b border-[#dadde1] my-1"></div>

              <div className="flex justify-center pt-1">
                <a
                  href="http://localhost:5173/daftar-affiliate"
                  className="bg-[#42b72a] text-white font-bold text-[17px] px-4 py-3 rounded-lg hover:bg-[#36a420] transition-colors"
                >
                  Daftar Affiliate Mendunia
                </a>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#606770]">
              Dengan mendaftar, Anda menyetujui{" "}
              <a href="/kebijakan-privasi" className="font-semibold text-[#1c1e21] hover:underline">Kebijakan Privasi</a>{" "}
              &middot;{" "}
              <a href="/syarat-ketentuan" className="font-semibold text-[#1c1e21] hover:underline">Syarat & Ketentuan</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right - Info Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0D1F3C] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(https://awsimages.detik.net.id/community/media/visual/2022/09/13/lanskap-gunung-fuji-yang-indahnya-engga-ada-obat-1_169.jpeg?w=600&q=90)" }}>
          <div className="absolute inset-0 bg-[#0D1F3C]/60" />
        </div>
        <div className="max-w-md text-center fade-in relative z-10" style={{ animationDelay: '0.2s' }}>
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/20">
            <img src="/logo-sm.png" alt="" className="w-10 h-10 brightness-0 invert" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Peluang Kerja Mendunia</h2>
          <p className="text-xl font-semibold text-[#f0c040] mb-2">di Jepang & Korea Selatan</p>
          <p className="text-[#b0b8cc] leading-relaxed mb-10 max-w-sm mx-auto">
            Kami bersamai sampai kamu bisa Sukses Kerja ke Jepang dan Korea Selatan
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-5 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="text-left">
                <p className="text-sm font-bold text-white">Program Jepang</p>
                <p className="text-xs text-[#8a94a8] mt-1 leading-relaxed">Pelatihan bahasa & budaya Jepang, persiapan kerja di Jepang</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="text-left">
                <p className="text-sm font-bold text-white">Program Korea Selatan</p>
                <p className="text-xs text-[#8a94a8] mt-1 leading-relaxed">Pelatihan bahasa & budaya Korea, persiapan kerja di Korea</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-[#6a7490]">#BersamaMendunia #SuksesKeLuarNegeri</p>
          </div>
        </div>
      </div>
    </div>
  );
}
