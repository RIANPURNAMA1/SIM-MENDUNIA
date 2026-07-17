import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { RefreshCw, Eye, EyeOff, LogIn } from "lucide-react";

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
      } else if (role === "ADMIN_CABANG") {
        window.location.href = "/admin-cabang";
      } else if (role === "ACCOUNTING") {
        window.location.href = "/dashboard-keuangan";
      } else if (role === "MANAGER" || role === "HR" || role === "ADMIN") {
        window.location.href = "/";
      } else {
        window.location.href = "/dashboard-karyawan";
      }
    } catch (err: unknown) {
      let msg = "Email atau password salah";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        msg = axiosErr.response?.data?.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px] fade-in">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/logo-sm.png" alt="Mendunia" className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">mendunia.id</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Masuk</h1>
            <p className="text-sm text-gray-500">Masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Masukkan email atau nama"
                className="w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-gray-900 placeholder-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full h-11 px-3.5 pr-12 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-gray-900 placeholder-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Verifikasi</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput("") }}
                  className="sm:flex-none w-full sm:w-[88px] h-11 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center select-none relative overflow-hidden group cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <span className="text-lg font-black tracking-[0.2em] text-gray-700">{captcha}</span>
                  <div className="absolute inset-0 bg-[#0E6187]/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                    <RefreshCw size={13} />
                    <span>Ulang</span>
                  </div>
                </button>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  placeholder="Masukkan kode"
                  className="w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-gray-900 placeholder-gray-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">Klik kode di samping untuk memperbarui</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11 bg-[#0E6187] text-white font-semibold text-sm rounded-lg hover:bg-[#1a5e6f] active:scale-[0.99] transition-all flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  Masuk
                </span>
              )}
            </button>

            <div className="text-center pt-1">
              <Link to="/forgot-password" className="text-sm text-[#0E6187] font-medium hover:underline">
                Lupa kata sandi?
              </Link>
            </div>
          </form>

          <div className="mt-10 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              Dengan masuk, Anda menyetujui{" "}
              <a href="/kebijakan-privasi" className="text-gray-600 font-medium hover:underline">Kebijakan Privasi</a>
              {" "}&{" "}
              <a href="/syarat-ketentuan" className="text-gray-600 font-medium hover:underline">Syarat & Ketentuan</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right - Info Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0E6187] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(https://awsimages.detik.net.id/community/media/visual/2022/09/13/lanskap-gunung-fuji-yang-indahnya-engga-ada-obat-1_169.jpeg?w=600&q=90)" }}>
          <div className="absolute inset-0 bg-[#0E6187]/60" />
        </div>
        <div className="max-w-md text-center fade-in relative z-10" style={{ animationDelay: '0.2s' }}>
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/20">
            <img src="/logo-sm.png" alt="" className="w-10 h-10 brightness-0 invert" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Peluang Kerja Mendunia</h2>
          <p className="text-xl font-semibold text-[#f0c040] mb-2">di Jepang & Korea Selatan</p>
          <p className="text-[#b0b8cc] leading-relaxed mb-10 max-w-sm mx-auto">
            Kami menemani sampai kamu bisa Sukses Kerja ke Jepang dan Korea Selatan
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-5 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-left">
                <p className="text-sm font-bold text-white">Program Jepang</p>
                <p className="text-xs text-[#8a94a8] mt-1 leading-relaxed">Pelatihan bahasa & budaya Jepang, persiapan kerja di Jepang</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
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
