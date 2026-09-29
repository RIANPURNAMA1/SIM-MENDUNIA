import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  MailCheck,
  ShieldCheck,
  Clock,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { id: "lower", label: "Terdapat minimal satu huruf kecil", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Terdapat minimal satu huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Terdapat minimal satu angka", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "Terdapat salah satu simbol: ! @ # $ % ^ & *", test: (p: string) => /[!@#$%^&*]/.test(p) },
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [step, setStep] = useState<"otp" | "password">(searchParams.get("code") ? "password" : "otp");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [token, setToken] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [devCode, setDevCode] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  const allMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));

  const handleOtpChange = (value: string, index: number) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setCode(prev => {
        const next = [...prev];
        next[index] = "";
        return next.join("").slice(0, OTP_LENGTH);
      });
      return;
    }

    setCode(prev => {
      const next = (prev + clean).slice(0, OTP_LENGTH);
      if (index + 1 < OTP_LENGTH && next.length > index + 1) {
        otpRefs.current[index + 1]?.focus();
      }
      return next;
    });
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    setCode(text);
    const focusIndex = Math.min(text.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (code.length !== OTP_LENGTH) {
      setError(`Masukkan ${OTP_LENGTH} digit kode OTP dengan lengkap.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, code });
      setToken(res.data.token);
      setStep("password");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.code?.[0] ||
          "Gagal memverifikasi kode OTP"
      );
      if (typeof err.response?.data?.attempts_left === "number") {
        setAttemptsLeft(err.response.data.attempts_left);
      }
      setCode("");
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setInfo(res.data.message);
      setCooldown(RESEND_COOLDOWN);
      setDevCode(res.data.dev_code ?? "");
      setAttemptsLeft(null);
    } catch (err: any) {
      const wait = err.response?.data?.cooldown;
      if (typeof wait === "number") setCooldown(wait);
      setError(err.response?.data?.message || "Gagal mengirim ulang kode OTP");
    } finally {
      setIsResending(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    const unmet = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
    if (unmet.length > 0) {
      setError(
        `Password harus memenuhi semua ketentuan: ${unmet.map((r) => r.label).join("; ")}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mereset password");
      if (err.response?.status === 422) {
        setStep("otp");
        setToken("");
      }
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
              {step === "otp" ? (
                <MailCheck size={26} className="text-[#0E6187]" />
              ) : (
                <ShieldCheck size={26} className="text-[#0E6187]" />
              )}
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0E6187] text-[11px] font-bold text-white">
                1
              </span>
              <span className={`h-[3px] flex-1 rounded ${step === "password" ? "bg-[#0E6187]" : "bg-[#d5dae0]"}`} />
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === "password" ? "bg-[#0E6187] text-white" : "bg-[#d5dae0] text-[#8d949e]"
                }`}
              >
                2
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#1c1e21] mb-1">
              {step === "otp" ? "Masukkan Kode OTP" : "Buat Password Baru"}
            </h1>
            <p className="text-sm text-[#606770] mb-6">
              {step === "otp" ? (
                <>
                  Kami kirim kode 6 digit ke{" "}
                  <span className="font-semibold text-[#1c1e21]">{email}</span>. Masukkan kode
                  tersebut untuk melanjutkan.
                </>
              ) : (
                "Password baru minimal 8 karakter dan harus memenuhi ketentuan di bawah."
              )}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
                {error}
              </div>
            )}

            {info && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[13px] font-semibold text-emerald-700 text-center">
                {info}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700 text-center">
                {success}
              </div>
            )}

            {devCode && /^\d{6}$/.test(devCode) && step === "otp" && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-700">
                  MODE DEVELOPMENT — kode OTP
                </p>
                <p className="text-xl font-extrabold tracking-widest text-amber-800">
                  {devCode}
                </p>
              </div>
            )}

            {step === "otp" ? (
              <form onSubmit={verifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1e21] mb-2">
                    Kode OTP
                  </label>
                  <div className="flex gap-1.5 sm:gap-2">
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={el => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={code[i] ?? ""}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKeyDown(e, i)}
                        onPaste={handleOtpPaste}
                        disabled={isSubmitting}
                        className="h-[56px] w-full min-w-0 rounded-lg border border-[#dddfe2] bg-[#f5f6f7] text-center text-xl font-bold text-[#1c1e21] focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] focus:bg-white disabled:opacity-60"
                      />
                    ))}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#606770]">
                    <Clock size={13} />
                    Kode berlaku 10 menit
                    {attemptsLeft !== null && (
                      <span className="font-semibold text-red-600">
                        · sisa percobaan {attemptsLeft}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== OTP_LENGTH}
                  className="w-full bg-[#0E6187] text-white font-bold text-[18px] py-3 rounded-lg hover:bg-[#1a5e6f] transition-colors flex justify-center items-center gap-2 h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Verifikasi Kode</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={cooldown > 0 || isResending}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6187] hover:underline disabled:text-[#8d949e] disabled:no-underline disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
                    {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : "Kirim ulang kode OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={savePassword} className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    placeholder="Password Baru"
                    className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-[#1c1e21] placeholder-[#8d949e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0E6187] hover:underline"
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>

                <div className="space-y-1.5 -mt-1">
                  {PASSWORD_REQUIREMENTS.map((r) => {
                    const met = r.test(password);
                    return (
                      <div key={r.id} className="flex items-start gap-2 text-[13px]">
                        <span
                          className={`mt-0.5 flex-none h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            met ? "bg-emerald-500 text-white" : "bg-[#dddfe2] text-[#8d949e]"
                          }`}
                        >
                          {met ? "✓" : ""}
                        </span>
                        <span className={met ? "text-emerald-700 font-medium" : "text-[#606770]"}>
                          {r.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Konfirmasi Password Baru"
                  className="w-full h-[52px] px-4 text-[17px] bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:outline-none focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187] text-[#1c1e21] placeholder-[#8d949e]"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !allMet}
                  className="w-full bg-[#0E6187] text-white font-bold text-[18px] py-3 rounded-lg hover:bg-[#1a5e6f] transition-colors flex justify-center items-center gap-2 h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      <span>Simpan Password Baru</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("otp");
                      setToken("");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6187] hover:underline"
                  >
                    <ArrowLeft size={15} />
                    Ubah kode OTP
                  </button>
                </div>
              </form>
            )}

            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-[#0E6187] font-medium hover:underline"
              >
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
