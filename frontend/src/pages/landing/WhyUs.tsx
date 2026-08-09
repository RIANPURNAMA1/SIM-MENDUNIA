import { Sparkles, Wallet, BookOpenCheck, ShieldCheck } from "lucide-react";
import Reveal from "../../components/Reveal";

const BRAND = "#0E6187";

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

interface WhyUsProps {
  companyName: string;
  ptName: string;
}

export default function WhyUs({ companyName, ptName }: WhyUsProps) {
  return (
    <section id="tentang" className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Reveal direction="up">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Kenapa Harus Ikut Kelas di
            </h2>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0E6187] mb-3">{companyName}</h2>
            <p className="text-slate-600 leading-relaxed">
              {ptName} berkomitmen membantu calon pekerja Indonesia meraih peluang
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
  );
}
