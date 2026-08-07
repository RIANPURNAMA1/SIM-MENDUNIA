import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Laptop,
  Building2,
  Briefcase,
  Sparkles,
  Wallet,
  BookOpenCheck,
  ShieldCheck,
  Quote,
  AtSign,
  Send,
  Share2,
  X,
  Star,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

// Brand icon fallbacks (removed from lucide-react)
import { companyProfileApi } from "../services/api";
import ThemeToggle from "../components/ThemeToggle";
import HeroSection from "./landing/Hero";
import AnimateInView from "../components/AnimateInView";
import Reveal from "../components/Reveal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const stats = [
  { value: "2000+", label: "Alumni Berhasil", target: 2000, suffix: "+", isPercent: false },
  { value: "95%", label: "Tingkat Kelulusan", target: 95, suffix: "%", isPercent: true },
  { value: "5", label: "Program Tersedia", target: 5, suffix: "", isPercent: false },
  { value: "4.9★", label: "Rating Peserta", target: 4.9, suffix: "★", isPercent: false },
];

function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [startOnView, started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, ref };
}

function StatItem({ s }: { s: (typeof stats)[number] }) {
  const { count, ref } = useCountUp(s.target, 2000, true);

  const display =
    s.isPercent || s.target % 1 !== 0
      ? count.toFixed(s.target % 1 === 0 ? 0 : 1)
      : Math.floor(count);

  return (
    <div ref={ref} className="p-6 text-center">
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0069B0" }}>
        {display}
        {s.suffix}
      </div>
      <div className="text-xs md:text-sm text-slate-500 mt-1">{s.label}</div>
    </div>
  );
}

function StatsCounter() {
  return (
    <section className="relative z-10 -mt-10 mb-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Reveal direction="up" delay={100}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {stats.map((s, i) => (
                <Reveal key={s.label} direction="up" delay={i * 120}>
                  <StatItem s={s} />
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

interface Profile {
  company_name: string;
  pt_name: string;
  address: string;
  email: string;
  phone: string;
  logo_url: string | null;
}

const DEFAULT_PROFILE: Profile = {
  company_name: "Mendunia",
  pt_name: "PT Indonesia Sukses Mendunia",
  address: "Perumahan Bumi Marhamah Blok C1, Desa Sindangasih, Karang Tengah, Cianjur - Jawa Barat",
  email: "admin@mendunia.id",
  phone: "0895 3916 85825",
  logo_url: null,
};

const BRAND = "#0E6187";

const classPrograms = [
  {
    icon: Laptop,
    title: "Kelas Online",
    desc: "Belajar fleksibel dari mana saja dengan pengajar berpengalaman.",
  },
  {
    icon: Building2,
    title: "Kelas Offline",
    desc: "Belajar tatap muka langsung di cabang Mendunia terdekat.",
  },
  {
    icon: Briefcase,
    title: "Kelas Bisnis",
    desc: "Program khusus untuk karyawan & profesional yang ingin bekerja ke luar negeri.",
  },
  {
    icon: Sparkles,
    title: "Kelas Spesial",
    desc: "Pendampingan intensif untuk persiapan ujian dengan target kelulusan tinggi.",
  },
];

const whyUs = [
  {
    icon: Sparkles,
    title: "Fleksibilitas",
    desc: "Pilihan kelas online, offline, karyawan, dan bisnis sesuai kebutuhanmu.",
  },
  {
    icon: Wallet,
    title: "Terjangkau & Transparan",
    desc: "Program pelatihan dengan biaya yang jelas tanpa biaya tersembunyi.",
  },
  {
    icon: BookOpenCheck,
    title: "Kurikulum Terbukti",
    desc: "Metode belajar yang telah meluluskan banyak peserta, bahkan dengan nilai penuh.",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Sampai Lulus & Kerja",
    desc: "Keleluasaan mengikuti kelas kembali sampai kamu siap berangkat kerja.",
  },
];

const programs = [
  {
    country: "Jepang",
    title: "Program Bahasa Jepang",
    description:
      "Pelatihan bahasa & budaya Jepang, persiapan lulus JFT A2 Basic hingga siap kerja di Jepang.",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-10.png",
    shortDesc: "Program bahasa & budaya Jepang, persiapan JFT A2 Basic sampai siap kerja.",
  },
  {
    country: "Korea Selatan",
    title: "Program Bahasa Korea",
    description:
      "Pelatihan intensif 3 bulan plus 1 bulan pemantapan untuk persiapan ujian EPS-TOPIK.",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-12.png",
    shortDesc: "Program intensif persiapan EPS-TOPIK dan pendampingan kerja ke Korea.",
  },
];

const testimonials = [
  {
    name: "Agam Slamet",
    program: "Alumni Kelas Mendunia Jepang",
    text: "Alhamdulillah sudah di Jepang sejak Mei 2023 melalui LPK Mendunia Jepang.",
    city: "Cianjur",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    name: "Resti Nurmala Sari",
    program: "Alumni Kelas Mendunia Jepang",
    text: "Alhamdulillah sudah di Jepang sejak Juli 2023 melalui LPK Mendunia Jepang.",
    city: "Bandung",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "Muhammad Rupawan",
    program: "Alumni Kelas Mendunia Korea",
    text: "Alhamdulillah sudah di Korea Selatan sejak Desember 2023 melalui LPK Mendunia Korea.",
    city: "Jakarta",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=53",
  },
  {
    name: "Ripan Dandi Suwandi",
    program: "Alumni Kelas Mendunia Korea",
    text: "Alhamdulillah sudah di Korea Selatan sejak Agustus 2023 melalui LPK Mendunia Korea.",
    city: "Sukabumi",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Siti Nurhaliza",
    program: "Alumni Kelas Mendunia Jepang",
    text: "Pelatihan sangat membantu, dari nol sampai bisa kerja di Jepang.",
    city: "Bogor",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=44",
  },
  {
    name: "Ahmad Fauzi",
    program: "Alumni Kelas Mendunia Korea",
    text: "Sangat terbantu dengan sistem pembelajaran yang terstruktur.",
    city: "Depok",
    rating: 4,
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Dewi Sartika",
    program: "Alumni Kelas Mendunia Jepang",
    text: "Mengikuti kelas di sini adalah keputusan terbaik untuk karir saya.",
    city: "Bekasi",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Rizky Hidayat",
    program: "Alumni Kelas Mendunia Korea",
    text: "Proses pembelajaran mudah dipahami dan pengajar sangat profesional.",
    city: "Tangerang",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=59",
  },
];

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
];

export default function CompanyLanding() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState<string>("");

  useEffect(() => {
    companyProfileApi
      .get()
      .then((res) => {
        if (res?.data?.data) {
          setProfile({
            company_name: res.data.data.company_name || DEFAULT_PROFILE.company_name,
            pt_name: res.data.data.pt_name || DEFAULT_PROFILE.pt_name,
            address: res.data.data.address || DEFAULT_PROFILE.address,
            email: res.data.data.email || DEFAULT_PROFILE.email,
            phone: res.data.data.phone || DEFAULT_PROFILE.phone,
            logo_url: res.data.data.logo_url || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const logo = profile.logo_url || "/logo-sm.png";
  const waNumber = "62895391685825";

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <HeroSection waNumber={waNumber} />
      {/* Stats Counter */}
      <StatsCounter />

      {/* Pilih Program */}
      <section className="py-16 md:py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Pilih Program yang Cocok Untukmu
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Beragam format kelas yang bisa kamu sesuaikan dengan waktu dan kebutuhanmu.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classPrograms.map((c, i) => (
              <Reveal key={c.title} direction="up" delay={i * 100}>
                <div
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: "rgba(14,97,135,0.1)" }}
                  >
                    <c.icon size={28} style={{ color: BRAND }} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{c.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tentang / Kenapa */}
      <section id="tentang" className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Kenapa Harus Ikut Kelas di
              </h2>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0E6187] mb-3">{profile.company_name}</h2>
              <p className="text-slate-600 leading-relaxed">
                {profile.pt_name} berkomitmen membantu calon pekerja Indonesia meraih peluang
                kerja di Jepang dan Korea Selatan melalui pelatihan yang menyeluruh.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {whyUs.map((item, i) => (
              <Reveal key={item.title} direction="up" delay={i * 100}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(14,97,135,0.1)" }}
                  >
                    <item.icon size={28} style={{ color: BRAND }} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Program Detail */}
      <section id="program" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Program Kelas Di <span className="text-[#0E6187]">{profile.company_name}</span>
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Pilih program yang sesuai dengan tujuanmu dan mulai perjalanan kariermu di luar negeri.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((prog, i) => (
              <Reveal key={prog.country} direction={i % 2 === 0 ? "left" : "right"} delay={i * 120}>
                <div
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
                >
                <div className="relative h-56 md:h-64 w-full overflow-hidden bg-slate-100">
                  <img
                    src={prog.image}
                    alt={prog.title}
                    className="h-full w-full object-cover cursor-zoom-in"
                    loading="lazy"
                    onClick={() => {
                      setPreviewImage(prog.image);
                      setPreviewAlt(prog.title);
                    }}
                  />
                </div>
                <div className="p-6 md:p-8">
                  <p
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
                    style={{ backgroundColor: "rgba(14,97,135,0.08)", color: BRAND }}
                  >
                    {prog.country}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{prog.shortDesc}</p>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                    style={{ backgroundColor: "#f9b700", color: "#000000" }}
                  >
                    Lihat Selengkapnya <ArrowRight size={15} />
                  </a>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section id="testimoni" className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND }}>
                Testimoni
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Mereka yang Sudah Kerja Mendunia
              </h2>
            </div>
          </Reveal>
          <div className="hidden md:flex gap-5">
            {[
              { items: testimonials.slice(0, 4), direction: "up" as const, duration: 25 },
              { items: [...testimonials.slice(2), ...testimonials.slice(0, 2)], direction: "down" as const, duration: 22 },
              { items: [...testimonials.slice(5), ...testimonials.slice(0, 5)], direction: "up" as const, duration: 28 },
            ].map((col, i) => (
              <div key={i} className="flex-1 overflow-hidden relative h-[520px]">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />
                <div
                  className={col.direction === "up" ? "animate-marquee-up" : "animate-marquee-down"}
                  style={{ animationDuration: `${col.duration}s` }}
                >
                  {[...col.items, ...col.items].map((t, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 mb-4 hover:shadow-md transition-all duration-300">
                      <div className="mb-3">
                        <MessageCircle className="w-4 h-4" style={{ color: BRAND }} />
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: t.rating }).map((_, starIdx) => (
                          <Star key={starIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-slate-100">
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.program} &middot; {t.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <div className="flex-1 overflow-hidden relative h-[520px]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />
              <div className="animate-marquee-up" style={{ animationDuration: "22s" }}>
                {[...testimonials, ...testimonials].map((t, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
                    <div className="mb-3">
                      <MessageCircle className="w-4 h-4" style={{ color: BRAND }} />
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, starIdx) => (
                        <Star key={starIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-slate-100">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.program} &middot; {t.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

 {/* CTA Banner */}
<section className="py-16 md:py-20">
  <div className="max-w-6xl mx-auto px-4 md:px-6">
    <Reveal direction="up" threshold={0.1}>
    <div
      className="relative rounded-3xl overflow-hidden border border-slate-200"
      style={{ backgroundColor: "rgba(14,97,135,0.04)" }}
    >
      {/* decorative accents — flat shapes, no gradient */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-40"
        style={{ backgroundColor: "rgba(14,97,135,0.10)" }}
      />
      <div
        className="pointer-events-none absolute bottom-6 left-6 h-16 w-16 rounded-full opacity-60"
        style={{ backgroundColor: "rgba(250,204,21,0.20)" }}
      />

      <div className="relative grid md:grid-cols-2 items-center">
        {/* Text side */}
        <div className="px-6 py-14 md:py-20 md:px-10 text-center md:text-left">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold mb-5"
            style={{ backgroundColor: "rgba(14,97,135,0.1)", color: BRAND }}
          >
            <Sparkles size={13} />
            Konsultasi Gratis
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
            Wujudkan Mimpimu dan Raih
            <br className="hidden md:block" /> Suksesmu untuk Kerja Mendunia
          </h2>
          <p className="text-slate-600 mb-8 max-w-sm mx-auto md:mx-0">
            Konsultasikan dulu kebutuhanmu bersama tim kami — kami bantu dari nol sampai berangkat.
          </p>
          <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3">
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-md bg-yellow-400 text-sm font-bold text-slate-900 shadow-sm hover:bg-yellow-300 hover:shadow-md transition-all"
            >
              Hubungi Admin
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
           
          </div>
        </div>

        {/* Image side */}
        <div className="relative h-96 md:h-[600px] bg-white">
          <img
            src="/models2.png"
            alt="Model Mendunia"
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
          />
        </div>
      </div>
    </div>
    </Reveal>
  </div>
</section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <Reveal direction="up">
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ backgroundColor: "rgba(14,97,135,0.08)", color: BRAND }}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
                Masih ada yang mengganjal? Ini beberapa jawabannya.
              </p>
            </div>
          </Reveal>

          {/* FAQ list */}
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <AnimateInView key={i} delay={i * 80}>
                  <div
                    className={`rounded-2xl border transition-all duration-200 ${
                      isOpen
                        ? "border-slate-200 bg-slate-50/50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "rgba(14,97,135,0.08)", color: BRAND }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {f.q}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isOpen ? "max-h-96" : "max-h-0"
                      }`}
                    >
                      <div className="px-6 pb-5 pl-16">
                        <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </AnimateInView>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer phone={profile.phone || "-"} />

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noreferrer"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2"
        aria-label="Chat WhatsApp"
      >
        <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:px-4 group-hover:py-2.5 group-hover:opacity-100">
          Mau tanya Program? chat admin rindu 😊
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95">
          <svg
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </span>
      </a>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={previewImage}
            alt={previewAlt}
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}