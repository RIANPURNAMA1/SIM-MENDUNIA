import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Clock,
  CalendarCheck,
  Globe2,
  GraduationCap,
  CheckCircle2,
  Phone,
  Layers3,
} from "lucide-react";
import { companyProfileApi } from "../../services/api";
import { programs } from "./programsData";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import WhatsAppButton from "./WhatsAppButton";
import Seo, { SITE_URL } from "../../components/Seo";

interface Profile {
  company_name: string;
  pt_name: string;
  phone: string;
}

const DEFAULT_PROFILE: Profile = {
  company_name: "Mendunia",
  pt_name: "PT Indonesia Sukses Mendunia",
  phone: "0895 3916 85825",
};

export default function ProgramPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    companyProfileApi
      .get()
      .then((res) => {
        if (res?.data?.data) {
          setProfile({
            company_name: res.data.data.company_name || DEFAULT_PROFILE.company_name,
            pt_name: res.data.data.pt_name || DEFAULT_PROFILE.pt_name,
            phone: res.data.data.phone || DEFAULT_PROFILE.phone,
          });
        }
      })
      .catch(() => {});
  }, []);

  const waLink = `https://wa.me/62895391685825?text=${encodeURIComponent(
    `Halo ${profile.company_name}, saya ingin mengetahui program pelatihan yang tersedia. Mohon infonya.`
  )}`;

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title="Program Kerja Jepang & Korea Selatan"
        description="Program pelatihan bahasa dan penempatan kerja Mendunia: persiapan JFT A2 Basic untuk Jepang dan EPS-TOPIK untuk Korea Selatan, dengan kelas online, offline, bisnis, dan spesial."
        keywords="program kerja Jepang, program kerja Korea Selatan, JFT A2 Basic, EPS-TOPIK, LPK Mendunia, kelas bahasa Jepang, kelas bahasa Korea"
        canonical={`${SITE_URL}/program`}
      />
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
            <img
              src="https://asset.kompas.com/crops/YHHRwSDTlCXRtGge51HzpC2ueR8=/0x0:632x421/1200x800/data/photo/2020/02/01/5e345e3395263.jpg"
              alt="Program Pelatihan"
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0, 106, 176, 0.94)" }} />
          </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-32 lg:py-40">
          <Reveal direction="up">
            <nav className="flex items-center gap-1.5 text-xs md:text-sm text-white/80 mb-6">
              <Link to="/landing" className="hover:text-white transition-colors">Beranda</Link>
              <ChevronRight size={14} />
              <span className="text-white">Program</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/25">
                Program Pelatihan
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Program Kami
            </h1>
            <p className="text-white/90 text-sm md:text-lg leading-relaxed max-w-3xl">
              Pilih program pelatihan bahasa dan keahlian sesuai tujuanmu, dan mulailah
              perjalanan karier internasional bersama {profile.company_name}.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-8 md:text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Pelatihan Bahasa &amp; Budaya
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Persiapan Ujian Resmi
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Pendampingan Sampai Berangkat
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Daftar Program ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Pilihan Program
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Siapkan Kariermu di Luar Negeri
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Setiap program dirancang menyeluruh: dari pengenalan bahasa, persiapan
                ujian sertifikasi, hingga pendampingan keberangkatan.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((prog, i) => (
              <Reveal key={prog.slug} direction={i % 2 === 0 ? "left" : "right"} delay={i * 120}>
                <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300">
                  <div className="relative h-60 md:h-72 overflow-hidden bg-slate-100">
                    <img
                      src={prog.image}
                      alt={prog.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold text-[#0069b0]">
                      <Globe2 size={13} /> {prog.country}
                    </span>
                    <span className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                        {prog.title}
                      </h3>
                    </span>
                  </div>
                  <div className="p-6 md:p-7">
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                      {prog.overview}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={16} className="text-[#0069b0] shrink-0" /> {prog.duration}
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <CalendarCheck size={16} className="text-[#0069b0] shrink-0" /> {prog.schedule}
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <GraduationCap size={16} className="text-[#0069b0] shrink-0" /> {prog.mode}
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Layers3 size={16} className="text-[#0069b0] shrink-0" /> {prog.exam}
                      </div>
                    </div>
                    <Link
                      to={`/program/${prog.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f9b700] hover:bg-[#e0a500] text-black px-5 py-3 text-sm font-bold transition-colors active:scale-[0.98]"
                    >
                      Lihat Detail Program <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Proses ===== */}
      <section className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Alur Program
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Bagaimana Prosesnya?
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Kami mendampingi kamu di setiap langkah, dari pendaftaran hingga siap berangkat.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs[0].process.map((step, i) => (
              <Reveal key={step.title} direction="up" delay={i * 100}>
                <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#0069b0] text-white text-sm font-bold">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="zoom">
            <div className="rounded-3xl bg-gradient-to-br from-[#00508a] to-[#0069b0] px-6 md:px-12 py-12 md:py-14 text-center text-white">
              <h2 className="text-xl md:text-3xl font-bold mb-3">
                Bingung Pilih Program yang Tepat?
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
                Konsultasikan kebutuhan dan tujuanmu bersama tim kami, gratis tanpa biaya.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-[#f9b700] hover:bg-[#e0a500] text-black text-sm font-bold transition-colors active:scale-95"
                >
                  <Phone size={16} />
                  Konsultasi Sekarang
                </a>
                <Link
                  to="/tentang"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-white/40 hover:bg-white/10 text-sm font-semibold transition-colors"
                >
                  Kenali Kami Lebih Dekat
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