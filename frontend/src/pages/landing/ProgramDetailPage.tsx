import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Globe2,
  Clock,
  BookOpen,
  Users,
  BadgeCheck,
  ShieldCheck,
  HeartHandshake,
  Landmark,
  ChevronRight,
  CalendarCheck,
  MessageCircle,
  PenLine,
  Layers3,
  Target,
  Sparkles,
  Flag,
} from "lucide-react";
import { companyProfileApi } from "../../services/api";
import { programs, ProgramData } from "./programsData";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import WhatsAppButton from "./WhatsAppButton";
import Reveal from "../../components/Reveal";
import Seo, { SITE_URL } from "../../components/Seo";

const BRAND = "#0E6187";
const BRAND_DARK = "#0a4a68";

export default function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("MENDUNIA.ID");
  const [waNumber, setWaNumber] = useState("62895391685825");

  useEffect(() => {
    companyProfileApi
      .get()
      .then((res) => {
        if (res?.data?.data) {
          setCompanyName(res.data.data.company_name || "MENDUNIA.ID");
          const phone = String(res.data.data.phone || "0895 3916 85825").replace(/[^\d]/g, "");
          if (phone) setWaNumber(phone.startsWith("62") ? phone : "62" + phone);
        }
      })
      .catch(() => {});
  }, []);

  const program = programs.find((p) => p.slug === slug) || programs[0];
  const isFirst = program.slug === programs[0].slug;
  const next = programs.find((p) => p.slug !== program.slug);

  if (!program) {
    return (
      <div className="force-light min-h-screen bg-[#0069b0] text-slate-700">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Program tidak ditemukan</h1>
          <Link to="/landing" className="text-white/80 font-semibold hover:underline">
            Kembali ke Beranda
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Halo Mendunia, saya ingin mendaftar program ${program.title}. Mohon infonya.`
  )}`;

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title={`Program ${program.title} — Mendunia.id`}
        description={`Program ${program.title} di Mendunia.id untuk ${program.country}. ${program.tagline}`}
        keywords="program kerja luar negeri, pelatihan bahasa Jepang, pelatihan bahasa Korea, program Mendunia"
        canonical={`${SITE_URL}/program/${program.slug}`}
        type="article"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#00508a] to-[#0069b0] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <button
            onClick={() => navigate("/landing")}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Kembali ke Beranda
          </button>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-white/10 border border-white/20 mb-5">
                <Globe2 size={13} /> {program.country}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                {program.title}
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6">
                {program.tagline}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-colors"
                  style={{ backgroundColor: "#f9b700", color: "#000" }}
                >
                  <MessageCircle size={16} /> Daftar Sekarang
                </a>
                <a
                  href="#detail"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-colors"
                >
                  Lihat Detail Program <ChevronRight size={15} />
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src={program.image}
                alt={program.title}
                className="w-full rounded-2xl shadow-2xl object-cover aspect-[4/3]"
              />
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: Clock, label: "Durasi", value: program.duration },
              { icon: CalendarCheck, label: "Jadwal", value: program.schedule },
              { icon: BookOpen, label: "Mode", value: program.mode },
              { icon: BadgeCheck, label: "Ujian", value: program.exam },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm"
              >
                <s.icon size={18} className="mb-2 opacity-80" />
                <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview + Curriculum */}
      <section id="detail" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <Reveal direction="up">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Tentang Program</h2>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-10">
                  {program.overview}
                </p>
              </Reveal>

              <Reveal direction="up">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
                  {program.curriculumTitle}
                </h2>
              </Reveal>
              <div className="grid md:grid-cols-3 gap-4 mb-12">
                {program.curriculum.map((cur, i) => (
                  <Reveal key={cur.title} direction="up" delay={i * 100}>
                    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(14,97,135,0.1)" }}>
                        <GraduationCap size={18} style={{ color: BRAND }} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{cur.title}</h3>
                      <ul className="space-y-2">
                        {cur.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                            <Check size={14} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </div>

              </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <Reveal direction="up">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sticky top-24">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Keunggulan Program</h3>
                  <ul className="space-y-3">
                    {program.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(14,97,135,0.1)" }}>
                          <Check size={11} style={{ color: BRAND }} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                    style={{ backgroundColor: "#f9b700", color: "#000" }}
                  >
                    Konsultasi Gratis <ArrowRight size={15} />
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Tahapan Level — timeline */}
      <section className="py-16 md:py-20" style={{ backgroundColor: "#0069b0" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
              Tahapan Level
            </h2>
            <p className="text-sm md:text-base text-white/70 mb-10 text-center">
              Perjalanan belajarmu bertahap menuju target kelulusan.
            </p>
          </Reveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-white/25" />

            <div className="space-y-6">
              {program.levels.map((lv, i) => {
                const Icon = lv.icon;
                const isLast = i === program.levels.length - 1;
                return (
                  <Reveal key={lv.level} direction="up" delay={i * 100}>
                    <div className="relative flex items-start gap-5">
                      {/* Node */}
                      <div
                        className="relative z-10 mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-4"
                        style={{
                          backgroundColor: isLast ? "#f9b700" : "#ffffff",
                          boxShadow: isLast ? "0 0 0 8px rgba(249,183,0,0.2)" : "0 0 0 8px rgba(255,255,255,0.12)",
                        }}
                      >
                        <Icon size={20} className={isLast ? "text-black" : "text-[#0E6187]"} />
                      </div>

                      {/* Card */}
                      <div className={`flex-1 rounded-2xl p-5 ${isLast ? "bg-[#f9b700]" : "bg-white"}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold uppercase tracking-wide ${isLast ? "text-black/70" : "text-[#4aa6d6]"}`}>
                            {lv.tag}
                          </span>
                          <span className={`text-[11px] ${isLast ? "text-black/50" : "text-slate-400"}`}>
                            {isLast ? "Hasil Akhir" : `Tahap ${i + 1} dari ${program.levels.length - 1}`}
                          </span>
                        </div>
                        <h3 className={`text-base font-bold mt-1 ${isLast ? "text-black" : "text-slate-900"}`}>
                          {lv.level}
                        </h3>
                        <p className={`text-xs md:text-sm leading-relaxed mt-1 ${isLast ? "text-black/70" : "text-slate-600"}`}>
                          {lv.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Program details (requirements) */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">

          {/* Requirements */}
          <Reveal direction="up">
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <ShieldCheck size={20} style={{ color: BRAND }} />
                  <h3 className="text-base font-bold text-slate-900">Syarat Pendaftaran</h3>
                </div>
                <ul className="space-y-3">
                  {program.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <HeartHandshake size={20} style={{ color: BRAND }} />
                  <h3 className="text-base font-bold text-slate-900">Kami Siap Membantumu</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Dari awal pendaftaran sampai pemberangkatan, tim Mendunia selalu mendampingimu.
                  Jangan ragu untuk bertanya jika masih bingung dengan program ini.
                </p>
                <div className="flex items-center gap-2 rounded-xl p-4" style={{ backgroundColor: "rgba(14,97,135,0.06)" }}>
                  <Landmark size={18} style={{ color: BRAND }} />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lembaga resmi & terpercaya, siap membantumu bekerja ke {program.country}.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Process */}
          <Reveal direction="up">
            <div className="mt-14">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 text-center">
                Alur Pemberangkatan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {program.process.map((step, i) => (
                  <Reveal key={step.title} direction="up" delay={i * 100}>
                    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center hover:shadow-lg transition-all">
                      <div
                        className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4"
                        style={{ backgroundColor: i === 3 ? "#f9b700" : BRAND, color: i === 3 ? "#000" : "#fff" }}
                      >
                        {i + 1}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                      {i < 3 && (
                        <ChevronRight
                          size={18}
                          className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300"
                        />
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal direction="up">
            <div className="mt-14 rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #00508a, #0069b0)" }} />
              <div className="relative px-6 md:px-12 py-10 md:py-14 text-center">
                <h2 className="text-xl md:text-3xl font-bold text-white mb-3">
                  Siap Memulai Perjalananmu ke {program.country}?
                </h2>
                <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
                  Konsultasikan kebutuhanmu bersama tim kami dan dapatkan informasi biaya terbaru.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: "#f9b700", color: "#000" }}
                  >
                    <MessageCircle size={16} /> Daftar Sekarang
                  </a>
                  {next && (
                    <Link
                      to={`/program/${next.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-colors"
                    >
                      Lihat {next.title} <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
      <WhatsAppButton waNumber={waNumber} />
    </div>
  );
}
