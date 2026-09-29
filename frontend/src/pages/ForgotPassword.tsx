import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck, Send, ArrowLeft, KeyRound } from "lucide-react";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDevResetUrl("");

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccess(res.data.message);
      if (res.data.dev_reset_url) setDevResetUrl(res.data.dev_reset_url);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          "Gagal mengirim link reset password"
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
            <div className="w-14 h-14 rounded-2xl bg-[#0E6187]/10 flex items-center justify-center mb-5">
              <KeyRound size={26} className="text-[#0E6187]" />
            </div>

            <h1 className="text-2xl font-bold text-[#1c1e21] mb-1">Lupa Kata Sandi</h1>
            <p className="text-sm text-[#606770] mb-6">
              Masukkan email terdaftar. Kami akan mengirimkan link untuk membuat
              password baru ke inbox Anda.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <MailCheck size={34} className="mx-auto mb-3 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800 mb-1">
                  Kode OTP sudah dikirim
                </p>
                <p className="text-[13px] text-emerald-700 leading-relaxed">
                  {success}
                </p>
                <p className="text-[12px] text-emerald-600 mt-3">
                  Silakan cek folder spam bila email belum sampai dalam 5 menit.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                  className="mt-4 w-full bg-[#0E6187] text-white font-bold text-[15px] py-2.5 rounded-lg hover:bg-[#1a5e6f] transition-colors"
                >
                  Masukkan Kode OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess("");
                    setDevResetUrl("");
                    setEmail("");
                  }}
                  className="mt-3 text-sm font-semibold text-[#0E6187] hover:underline"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1e21] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="contoh: siswa@mendunia.com"
                    className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-[#1c1e21] placeholder-[#8d949e]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1 bg-[#0E6187] text-white font-bold text-[18px] py-3 rounded-lg hover:bg-[#1a5e6f] transition-colors flex justify-center items-center gap-2 h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Kirim Kode OTP</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 text-sm text-[#0E6187] font-medium hover:underline"
              >
                <ArrowLeft size={15} />
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Info Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0E6187] items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(https://awsimages.detik.net.id/community/media/visual/2022/09/13/lanskap-gunung-fuji-yang-indahnya-engga-ada-obat-1_169.jpeg?w=600&q=90)",
          }}
        >
          <div className="absolute inset-0 bg-[#0E6187]/60" />
        </div>
        <div
          className="max-w-md text-center fade-in relative z-10"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/20">
            <img src="/logo-sm.png" alt="" className="w-10 h-10 brightness-0 invert" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Peluang Kerja Mendunia</h2>
          <p className="text-xl font-semibold text-[#f0c040] mb-2">
            di Jepang & Korea Selatan
          </p>
          <p className="text-[#b0b8cc] leading-relaxed mb-10 max-w-sm mx-auto">
            Kami bersamai sampai kamu bisa Sukses Kerja ke Jepang dan Korea Selatan
          </p>
        </div>
      </div>
    </div>
  );
}
