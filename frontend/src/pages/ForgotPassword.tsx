import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          "Gagal mereset password"
      );
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
            <h1 className="text-2xl font-bold text-[#1c1e21] mb-1">Lupa Kata Sandi</h1>
            <p className="text-sm text-[#606770] mb-6">Masukkan email dan password baru Anda</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700 text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] text-[#1c1e21] placeholder-[#8d949e]"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Password Baru"
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

              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={6}
                placeholder="Konfirmasi Password Baru"
                className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] text-[#1c1e21] placeholder-[#8d949e]"
              />

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
                  "Reset Password"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-[#0D1F3C] font-medium hover:underline"
                >
                  Kembali ke Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right - Info Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0D1F3C] items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(https://awsimages.detik.net.id/community/media/visual/2022/09/13/lanskap-gunung-fuji-yang-indahnya-engga-ada-obat-1_169.jpeg?w=600&q=90)",
          }}
        >
          <div className="absolute inset-0 bg-[#0D1F3C]/60" />
        </div>
        <div
          className="max-w-md text-center fade-in relative z-10"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/20">
            <img src="/logo-sm.png" alt="" className="w-10 h-10 brightness-0 invert" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Peluang Kerja Mendunia</h2>
          <p className="text-xl font-semibold text-[#f0c040] mb-2">di Jepang & Korea Selatan</p>
          <p className="text-[#b0b8cc] leading-relaxed mb-10 max-w-sm mx-auto">
            Kami bersamai sampai kamu bisa Sukses Kerja ke Jepang dan Korea Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
