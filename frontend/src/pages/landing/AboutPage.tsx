import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Eye,
  ShieldCheck,
  BookOpenCheck,
  Wallet,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { companyProfileApi } from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Reveal from "../../components/Reveal";
import WhatsAppButton from "./WhatsAppButton";
import Seo, { SITE_URL } from "../../components/Seo";

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

const values = [
  {
    icon: ShieldCheck,
    title: "Integritas",
    desc: "Menjunjung tinggi kejujuran dan transparansi dalam setiap proses, dari pendaftaran hingga keberangkatan.",
  },
  {
    icon: BookOpenCheck,
    title: "Kualitas",
    desc: "Kurikulum pelatihan terstandar yang terbukti meluluskan banyak peserta dengan hasil terbaik.",
  },
  {
    icon: Sparkles,
    title: "Inovasi",
    desc: "Terus mengembangkan metode belajar yang adaptif agar peserta siap menghadapi dunia kerja global.",
  },
  {
    icon: Wallet,
    title: "Amanah",
    desc: "Menjaga kepercayaan peserta dan keluarga dengan pendampingan penuh hingga sukses di tempat kerja.",
  },
];

const stats = [
  { value: "2000+", label: "Alumni Berhasil" },
  { value: "95%", label: "Tingkat Kelulusan" },
  { value: "5", label: "Program Tersedia" },
  { value: "4.9★", label: "Rating Peserta" },
];

export default function AboutPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

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

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title="Tentang Kami — Mendunia.id"
        description={`Kenali ${profile.pt_name} (Mendunia): lembaga pelatihan bahasa dan penempatan kerja ke Jepang dan Korea Selatan di Cianjur, Jawa Barat. Visi, misi, dan nilai-nilai kami.`}
        keywords="tentang Mendunia, LPK Mendunia Cianjur, PT Indonesia Sukses Mendunia, profil lembaga pelatihan kerja Jepang Korea"
        canonical={`${SITE_URL}/tentang`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Mendunia",
          legalName: profile.pt_name,
          url: SITE_URL,
          telephone: profile.phone,
          email: profile.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Perumahan Bumi Marhamah Blok C1, Desa Sindangasih, Karang Tengah",
            addressLocality: "Cianjur",
            addressRegion: "Jawa Barat",
            addressCountry: "ID",
          },
        }}
      />
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative text-white overflow-hidden bg-[#0069B0]">
        <div className="absolute inset-0">
        <img
  src="https://awsimages.detik.net.id/community/media/visual/2022/09/13/lanskap-gunung-fuji-yang-indahnya-engga-ada-obat-1_169.jpeg?w=600&q=90"
  alt="Gunung Fuji"
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
              <span className="text-white">Tentang Kami</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/25">
                Profil Perusahaan
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Tentang {profile.company_name}
            </h1>
            <p className="text-white/90 text-sm md:text-lg leading-relaxed max-w-3xl">
              {profile.pt_name} hadir sebagai lembaga pelatihan bahasa dan keahlian yang
              membantu calon pekerja Indonesia meraih peluang kerja internasional di
              Jepang dan Korea Selatan.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-8 md:text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Pelatihan Bahasa &amp; Keahlian
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Jepang &amp; Korea Selatan
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Pendampingan Sampai Berangkat
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Cerita Kami ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal direction="right" className="order-2 lg:order-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 md:p-10">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt={profile.company_name} className="h-16 w-auto object-contain mb-6" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0069b0]/10 mb-6">
                    <ShieldCheck size={36} className="text-[#0069b0]" />
                  </div>
                )}
                <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-600">
                  <p>
                    Berawal dari kepedulian terhadap tingginya minat Tenaga Kerja Indonesia
                    untuk bekerja di luar negeri namun masih minimnya pendampingan yang
                    terpercaya, {profile.company_name} dibangun untuk menjadi jembatan
                    antara para calon pekerja dengan peluang kerja internasional.
                  </p>
                  <p>
                    Dengan pendekatan pelatihan bahasa dan keahlian yang menyeluruh, kami
                    mendampingi setiap peserta secara personal sejak pendaftaran,
                    persiapan ujian, hingga siap berangkat ke tempat kerja.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#0069b0] shrink-0" />
                      <span className="text-slate-700 text-sm">{profile.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-[#0069b0] shrink-0" />
                      <span className="text-slate-700 text-sm">{profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-[#0069b0] shrink-0" />
                      <span className="text-slate-700 text-sm">{profile.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" className="order-1 lg:order-2">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Siapa Kami
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
                Membuka Peluang,<br />Membentuk Masa Depan
              </h2>
              <p className="text-slate-600 !leading-relaxed mb-6">
                Kami percaya bahwa setiap orang berhak mendapat kesempatan berkarier yang
                lebih baik. Melalui pendampingan yang tulus dan terukur, kami membantu
                peserta membangun kompetensi bahasa dan keahlian yang diakui di industri
                Jepang dan Korea Selatan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Pendampingan personal sepanjang perjalanan",
                  "Fokus pada hasil: lulus ujian & berangkat kerja",
                  "Fleksibel — online, offline, karyawan, bisnis",
                  "Kurikulum yang terus diperbarui mengikuti standar",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-[#0069b0] shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to="/landing#program"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#f9b700] hover:bg-[#e0a500] text-black text-sm font-bold transition-all active:scale-95"
                >
                  Lihat Program Kami
                </Link>
                <a
                  href={`https://wa.me/62895391685825`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-[#0069b0] text-[#0069b0] hover:bg-[#0069b0]/5 text-sm font-semibold transition-colors"
                >
                  Konsultasi Gratis
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="bg-slate-50 border-y border-slate-200">
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

      {/* ===== Visi & Misi ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Visi &amp; Misi
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Arah {profile.company_name} ke Depan
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Komitmen fasih kami untuk selalu mendampingi peserta menjadi tenaga kerja
                yang profesional dan siap bersaing di panggung internasional.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal direction="up" delay={100}>
              <div className="h-full rounded-2xl bg-gradient-to-br from-[#00508a] to-[#0069b0] text-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 mb-5">
                  <Eye size={26} />
                </div>
                <h3 className="text-lg font-bold mb-3">Visi</h3>
                <p className="text-white/85 leading-relaxed text-sm">
                  Menjadi lembaga pelatihan dan penempatan kerja internasional yang
                  terpercaya, sehingga setiap peserta berangkat tepat waktu dengan
                  memuatkan keterampilan serta bahasa terbaik di pasar kerja global.
                </p>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#0069b0]/10 mb-5">
                  <Target size={26} className="text-[#0069b0]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Misi</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  {[
                    "Menyelenggarakan pelatihan bahasa dan keahlian berkualitas dengan pengajar berpengalaman.",
                    "Mendampingi peserta secara penuh dari pendaftaran hingga pemberangkatan.",
                    "Menjaga transparansi biaya dan proses hukum sesuai ketentuan yang berlaku.",
                    "Membangun kemitraan dengan institusi dan perusahaan terpercaya di Jepang & Korea.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={17} className="text-[#0069b0] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Nilai-Nilai ===== */}
      <section className="py-16 md:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Nilai Kami
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Prinsip Setiap Langkah Kami
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Nilai-nilai ini yang menjadi dasar setiap program dan pelayanan yang kami berikan.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {values.map((item, i) => (
              <Reveal key={item.title} direction="up" delay={i * 100}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0069b0]/10">
                    <item.icon size={28} className="text-[#0069b0]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
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
                Siap Memulai Karier Internasionalmu?
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
                Konsultasikan kebutuhanmu bersama tim kami dan dapatkan informasi biaya
                serta pendampingan dari pendaftaran hingga keberangkatan.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/62895391685825`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-[#f9b700] hover:bg-[#e0a500] text-black text-sm font-bold transition-colors active:scale-95"
                >
                  <Phone size={16} />
                  Konsultasi Sekarang
                </a>
                <Link
                  to="/landing#program"
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