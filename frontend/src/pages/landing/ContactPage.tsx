import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Mail, Clock, CheckCircle2, Send, MessageCircle } from "lucide-react";
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
}

const DEFAULT_PROFILE: Profile = {
  company_name: "Mendunia",
  pt_name: "PT Indonesia Sukses Mendunia",
  address: "Perumahan Bumi Marhamah Blok C1, Desa Sindangasih, Karang Tengah, Cianjur - Jawa Barat",
  email: "admin@mendunia.id",
  phone: "0895 3916 85825",
};

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=" +
  encodeURIComponent("Bumi Marhamah, Sindangasih, Karang Tengah, Cianjur, Jawa Barat") +
  "&output=embed";

export default function ContactPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [form, setForm] = useState({ nama: "", wa: "", pesan: "" });

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
          });
        }
      })
      .catch(() => {});
  }, []);

  const waNumber = "62895391685825";
  const waLink = `https://wa.me/${waNumber}`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Halo ${profile.company_name},\n\nNama: ${form.nama}\nNo. WhatsApp: ${form.wa}\n\n${form.pesan}`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");
  };

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title="Kontak — Hubungi Mendunia.id"
        description={`Hubungi Mendunia.id (${profile.pt_name}) di ${profile.address}. Konsultasi gratis via WhatsApp ${profile.phone}. Lembaga pelatihan kerja Jepang dan Korea Selatan.`}
        keywords="kontak Mendunia, alamat LPK Mendunia, WhatsApp Mendunia, lokasi Mendunia Cianjur"
        canonical={`${SITE_URL}/kontak`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Kontak Mendunia",
          url: `${SITE_URL}/kontak`,
          mainEntity: {
            "@type": "LocalBusiness",
            name: profile.pt_name,
            telephone: profile.phone,
            email: profile.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: "Perumahan Bumi Marhamah Blok C1, Desa Sindangasih, Karang Tengah",
              addressLocality: "Cianjur",
              addressRegion: "Jawa Barat",
              addressCountry: "ID",
            },
          },
        }}
      />
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://asset.kompas.com/crops/YHHRwSDTlCXRtGge51HzpC2ueR8=/0x0:632x421/1200x800/data/photo/2020/02/01/5e345e3395263.jpg"
            alt="Kontak Kami"
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
              <span className="text-white">Kontak</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/25">
                Hubungi Kami
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Kontak {profile.company_name}
            </h1>
            <p className="text-white/90 text-sm md:text-lg leading-relaxed max-w-3xl">
              Ada pertanyaan atau ingin konsultasi? Hubungi kami melalui WhatsApp, email,
              atau kunjungi langsung kantor kami.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-8 md:text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Konsultasi Gratis
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Respons Cepat
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#f9b700]" /> Staff Profesional
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Info Kontak ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-[#0069b0]/10 text-[#0069b0] px-3 py-1 text-xs font-semibold mb-4">
                Info Kontak
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Hubungi Kami Kapan Saja
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Sampaikan kebutuhanmu dan tim kami segera merespons.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Phone,
                title: "WhatsApp / Telepon",
                lines: [profile.phone, "Senin - Sabtu, 08.00 - 17.00 WIB"],
              },
              {
                icon: Mail,
                title: "Email",
                lines: [profile.email, "Balasan dalam 1x24 jam"],
              },
              {
                icon: Clock,
                title: "Jam Operasional",
                lines: ["Senin - Sabtu, 08.00 - 17.00 WIB", "Minggu Libur"],
              },
            ].map((item, i) => (
              <Reveal key={item.title} direction="up" delay={i * 100}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0069b0]/10">
                    <item.icon size={26} className="text-[#0069b0]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h3>
                  {item.lines.map((l) => (
                    <p key={l} className="text-xs text-slate-500 leading-relaxed">{l}</p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Form + Maps ===== */}
      <section className="pb-20 md:pb-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Reveal direction="right">
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Kirim Pesan</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Isi formulir di bawah — pesanmu akan diteruskan ke WhatsApp admin kami.
                </p>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Masukkan nama kamu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={form.wa}
                      onChange={(e) => setForm({ ...form, wa: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="cth: 0812-xxxx-xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pesan</label>
                    <textarea
                      required
                      rows={4}
                      value={form.pesan}
                      onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      placeholder="Tulis pertanyaan atau kebutuhanmu di sini..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f9b700] hover:bg-[#e0a500] text-black px-5 py-3 text-sm font-bold transition-colors active:scale-[0.98]"
                  >
                    <Send size={16} />
                    Kirim via WhatsApp
                  </button>
                </form>
              </div>
            </Reveal>

            {/* Maps */}
            <Reveal direction="left" delay={100}>
              <div className="h-full rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 min-h-[320px]">
                  <iframe
                    title="Lokasi Mendunia"
                    src={MAP_EMBED_URL}
                    className="w-full h-full min-h-[320px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#0069b0] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Alamat Kantor</p>
                      <p className="text-xs text-slate-500 leading-relaxed pt-1">{profile.pt_name}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{profile.address}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1fb959] text-white px-4 py-2 text-xs font-bold transition-colors"
                    >
                      <MessageCircle size={14} /> Chat WhatsApp
                    </a>
                    <a
                      href={MAP_EMBED_URL.replace("&output=embed", "")}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#0069b0] text-[#0069b0] hover:bg-[#0069b0]/5 px-4 py-2 text-xs font-semibold transition-colors"
                    >
                      <MapPin size={14} /> Buka di Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer phone={profile.phone || "-"} />

      <WhatsAppButton waNumber={waNumber} />
    </div>
  );
}