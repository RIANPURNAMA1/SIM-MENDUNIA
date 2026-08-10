import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, HelpCircle, Phone, CheckCircle2 } from "lucide-react";
import { companyProfileApi } from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import WhatsAppButton from "./WhatsAppButton";
import Seo, { SITE_URL } from "../../components/Seo";

interface Profile {
  company_name: string;
  phone: string;
}

const DEFAULT_PROFILE: Profile = {
  company_name: "Mendunia",
  phone: "0895 3916 85825",
};

const faqs = [
  {
    q: "Apakah ada Dana Talangan Keberangkatan?",
    a: "Ada. Kami bantu sediakan dana talangan dengan akad syariah.",
  },
  {
    q: "Saya belum pernah belajar bahasa Jepang / Korea, bisa ikut?",
    a: "Tentu bisa. Kurikulum kami terbukti efektif membantu peserta lulus Sertifikasi Bahasa Jepang JFT A2 Basic dan EPS-TOPIK Korea.",
  },
  {
    q: "Apakah saya hanya belajar bahasa atau juga dibantu berangkat kerja?",
    a: "Mendunia.id tidak hanya menyediakan pelatihan bahasa, kami mendampingi kamu hingga berhasil mendapatkan pekerjaan di Jepang maupun Korea Selatan.",
  },
  {
    q: "Berapa lama proses dari pendaftaran hingga keberangkatan?",
    a: "Setiap orang berbeda kecepatan prosesnya, namun rata-rata berdasarkan pengalaman kandidat sekitar 10–12 bulan.",
  },
  {
    q: "Jika tidak lulus tes dan ingin mengulang kelas, apakah bayar lagi?",
    a: "Tidak perlu. Kami memberikan garansi untuk mengulang kelas hingga lulus (syarat & ketentuan berlaku).",
  },
  {
    q: "Apa saja program pelatihan yang tersedia?",
    a: "Kami menyediakan Program Bahasa Jepang (persiapan JFT A2-Basic) dan Program Bahasa Korea (persiapan EPS-TOPIK), dengan pilihan kelas online, offline, karyawan, dan bisnis.",
  },
  {
    q: "Apakah ada pendampingan sampai berangkat ke luar negeri?",
    a: "Ya. Kami mendampingi peserta mulai dari pendaftaran, pelatihan, pendaftaran ujian, hingga proses visa dan pemberangkatan ke Jepang atau Korea Selatan.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isOpen
          ? "border-[#0069b0]/20 bg-[#0069b0]/[0.03] shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-5 text-left">
        <div className="flex items-start gap-4">
          <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#0069b0]/10 text-[#0069b0]">
            ?
          </span>
          <span className="text-sm font-semibold text-slate-800 leading-relaxed">{q}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0069b0]" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96" : "max-h-0"}`}>
        <div className="px-5 pb-5 md:px-6 md:pl-[60px]">
          <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    companyProfileApi
      .get()
      .then((res) => {
        if (res?.data?.data) {
          setProfile({
            company_name: res.data.data.company_name || DEFAULT_PROFILE.company_name,
            phone: res.data.data.phone || DEFAULT_PROFILE.phone,
          });
        }
      })
      .catch(() => {});
  }, []);

  const waLink = `https://wa.me/62895391685825?text=${encodeURIComponent(
    `Halo ${profile.company_name}, saya punya pertanyaan seputar program. Mohon infonya.`
  )}`;

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title="FAQ — Pertanyaan Seputar Kerja Jepang & Korea"
        description="Pertanyaan yang sering diajukan seputar program kerja Jepang dan Korea Selatan di Mendunia: dana talangan, durasi proses 10–12 bulan, garansi mengulang kelas, JFT A2 Basic, dan EPS-TOPIK."
        keywords="FAQ Mendunia, pertanyaan LPK Jepang Korea, biaya kerja Jepang Korea, dana talangan keberangkatan, garansi lulus"
        canonical={`${SITE_URL}/faq`}
      />
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://asset.kompas.com/crops/YHHRwSDTlCXRtGge51HzpC2ueR8=/0x0:632x421/1200x800/data/photo/2020/02/01/5e345e3395263.jpg"
            alt="Pertanyaan Seputar Program"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,105,176,0.65)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-32 lg:py-40">
          <Reveal direction="up">
            <nav className="flex items-center gap-1.5 text-xs md:text-sm text-white/80 mb-6">
              <Link to="/landing" className="hover:text-white transition-colors">Beranda</Link>
              <ChevronRight size={14} />
              <span className="text-white">FAQ</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/25">
                Help Center
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Pertanyaan yang Sering Diajukan
            </h1>
            <p className="text-white/90 text-sm md:text-lg leading-relaxed max-w-3xl">
              Temukan jawaban seputar program, proses pendaftaran, dan keberangkatan
              bersama {profile.company_name}.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-8 md:text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Jawaban Jelas &amp; Terpercaya
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Mencakup Proses Pendaftaran
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Sampai Keberangkatan
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0069b0]/10 text-[#0069b0] px-4 py-1.5 text-xs font-semibold mb-4">
                <HelpCircle size={14} /> FAQ
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
                Masih ada yang mengganjal? Ini beberapa jawabannya.
              </p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} direction="up" delay={i * 60}>
                <FaqItem
                  q={f.q}
                  a={f.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="zoom">
            <div className="rounded-3xl bg-gradient-to-br from-[#00508a] to-[#0069b0] px-6 md:px-12 py-12 md:py-14 text-center text-white">
              <h2 className="text-xl md:text-3xl font-bold mb-3">
                Pertanyaanmu Belum Terjawab?
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
                Tim kami siap membantu secara langsung via WhatsApp dengan respons cepat.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-[#f9b700] hover:bg-[#e0a500] text-black text-sm font-bold transition-colors active:scale-95"
                >
                  <Phone size={16} />
                  Tanya Admin
                </a>
                <Link
                  to="/program"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-white/40 hover:bg-white/10 text-sm font-semibold transition-colors"
                >
                  Lihat Program
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer phone={profile.phone || "-"} />

      <WhatsAppButton waNumber="62895391685825" />
    </div>
  );
}