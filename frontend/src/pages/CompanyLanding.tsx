import { useEffect, useState } from "react";
import { companyProfileApi } from "../services/api";
import Seo, { SITE_URL } from "../components/Seo";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroSection from "./landing/Hero";
import StatsCounter from "./landing/Stats";
import ClassPrograms from "./landing/ClassPrograms";
import WhyUs from "./landing/WhyUs";
import ProgramDetail from "./landing/ProgramDetail";
import Testimonials from "./landing/Testimonials";
import CtaBanner from "./landing/CtaBanner";
import Faq from "./landing/Faq";
import WhatsAppButton from "./landing/WhatsAppButton";

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

export default function CompanyLanding() {
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

  const waNumber = "62895391685825";

  return (
    <div className="force-light min-h-screen bg-white text-slate-700">
      <Seo
        title="Lembaga Pelatihan & Penempatan Kerja Jepang & Korea"
        description="Mendunia membantu calon pekerja sukses kerja ke Jepang dan Korea Selatan melalui pelatihan bahasa, budaya, dan persiapan kerja yang profesional."
        keywords="LPK Jepang Korea, pelatihan bahasa Jepang, program kerja Jepang Korea, EPS-TOPIK, JFT A2, LPK Mendunia, penempatan kerja luar negeri"
        canonical={`${SITE_URL}/landing`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Mendunia",
          legalName: "PT Indonesia Sukses Mendunia",
          url: SITE_URL,
          logo: `${SITE_URL}/logo-sm.png`,
          email: profile.email || DEFAULT_PROFILE.email,
          telephone: profile.phone || DEFAULT_PROFILE.phone,
          address: { "@type": "PostalAddress", streetAddress: "Bumi Marhamah Blok C1", addressLocality: "Cianjur", addressRegion: "Jawa Barat", addressCountry: "ID" },
          description: "Lembaga pelatihan bahasa untuk program kerja ke Jepang dan Korea Selatan.",
        }}
      />
      <Navbar />

      <HeroSection waNumber={waNumber} />
      <StatsCounter />
      <ClassPrograms />
      <WhyUs companyName={profile.company_name} ptName={profile.pt_name} />
      <ProgramDetail companyName={profile.company_name} waNumber={waNumber} />
      <Testimonials />
      <CtaBanner waNumber={waNumber} />
      <Faq />

      <Footer phone={profile.phone || "-"} />

      <WhatsAppButton waNumber={waNumber} />
    </div>
  );
}
