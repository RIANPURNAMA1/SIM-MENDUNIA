import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageCircle, Star, Phone, CheckCircle2 } from "lucide-react";
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

const stats = [
  { value: "2000+", label: "Alumni Berhasil" },
  { value: "95%", label: "Tingkat Kelulusan" },
  { value: "4.9★", label: "Rating Peserta" },
  { value: "3+", label: "Negara Tujuan" },
];

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
      <div className="mb-3 flex items-center justify-between">
        <MessageCircle className="w-5 h-5 text-[#0069b0]" />
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#0069b0]/10">
          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {t.program} &middot; {t.city}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TestimoniPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

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
    `Halo ${profile.company_name}, saya ingin tahu lebih banyak tentang programnya. Mohon infonya.`
  )}`;

  return (
    <div className="force-light min-h-screen bg-slate-50 text-slate-700">
      <Seo
        title="Testimoni Alumni Kerja Jepang & Korea"
        description="Cerita sukses alumni Mendunia yang telah bekerja di Jepang dan Korea Selatan. Berasal dari Cianjur, Bogor, Bandung, Depok, dan sekitarnya."
        keywords="testimoni alumni Mendunia, sukses kerja Jepang, sukses kerja Korea, alumni LPK Mendunia"
        canonical={`${SITE_URL}/testimoni`}
      />
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://asset.kompas.com/crops/YHHRwSDTlCXRtGge51HzpC2ueR8=/0x0:632x421/1200x800/data/photo/2020/02/01/5e345e3395263.jpg"
            alt="Kesuksesan Peserta"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#003d66]/95 via-[#00508a]/70 to-[#0069b0]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-32 lg:py-40">
          <Reveal direction="up">
            <nav className="flex items-center gap-1.5 text-xs md:text-sm text-white/80 mb-6">
              <Link to="/landing" className="hover:text-white transition-colors">Beranda</Link>
              <ChevronRight size={14} />
              <span className="text-white">Testimoni</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/25">
                Testimoni Peserta
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Mereka yang Sudah Kerja Mendunia
            </h1>
            <p className="text-white/90 text-sm md:text-lg leading-relaxed max-w-3xl">
              Cerita nyata dari alumni yang telah berangkat dan berhasil bekerja di Jepang
              serta Korea Selatan bersama {profile.company_name}.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-8 md:text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Alumni Berangkat &amp; Bekerja
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Pendampingan Hingga Berangkat
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Program Terpercaya
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <Reveal direction="up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0069B0]">
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm text-slate-500 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Testimoni ===== */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Kata Mereka
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Cerita Alumni Kami
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Kepuasan dan keberhasilan peserta adalah kebanggaan kami yang terbesar.
              </p>
            </div>
          </Reveal>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-16 md:w-24 z-10 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-24 z-10 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />

            {/* Baris atas: bergerak ke kiri */}
            <div className="overflow-hidden">
              <div className="flex gap-5 animate-marquee-left" style={{ animationDuration: "45s", width: "max-content" }}>
                {[...testimonials.slice(0, 4), ...testimonials.slice(0, 4)].map((t, idx) => (
                  <div key={idx} className="w-[320px] md:w-[360px] flex-shrink-0">
                    <TestimonialCard t={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* Baris bawah: bergerak ke kanan */}
            <div className="overflow-hidden mt-5">
              <div className="flex gap-5 animate-marquee-right" style={{ animationDuration: "50s", width: "max-content" }}>
                {[...testimonials.slice(4), ...testimonials.slice(4)].map((t, idx) => (
                  <div key={idx} className="w-[320px] md:w-[360px] flex-shrink-0">
                    <TestimonialCard t={t} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="zoom">
            <div className="rounded-3xl bg-gradient-to-br from-[#00508a] to-[#0069b0] px-6 md:px-12 py-12 md:py-14 text-center text-white">
              <h2 className="text-xl md:text-3xl font-bold mb-3">
                Ingin Menjadi Cerita Sukses Berikutnya?
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
                Mulai konsultasi gratis bersama tim kami dan raih kesempatan kerja di luar
                negeri.
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