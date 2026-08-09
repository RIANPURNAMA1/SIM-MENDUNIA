import { Laptop, Building2, Briefcase, Sparkles } from "lucide-react";
import Reveal from "../../components/Reveal";
import Parallax from "../../components/Parallax";
import ParallaxOrbs, { defaultOrbs } from "./ParallaxOrbs";

const BRAND = "#0E6187";

const classPrograms = [
  {
    icon: Laptop,
    title: "Kelas Online",
    desc: "Belajar fleksibel dari mana saja dengan pengajar berpengalaman.",
    speed: -0.06,
  },
  {
    icon: Building2,
    title: "Kelas Offline",
    desc: "Belajar tatap muka langsung di cabang Mendunia terdekat.",
    speed: 0.03,
  },
  {
    icon: Briefcase,
    title: "Kelas Bisnis",
    desc: "Program khusus untuk karyawan & profesional yang ingin bekerja ke luar negeri.",
    speed: -0.04,
  },
  {
    icon: Sparkles,
    title: "Kelas Spesial",
    desc: "Pendampingan intensif untuk persiapan ujian dengan target kelulusan tinggi.",
    speed: 0.06,
  },
];

export default function ClassPrograms() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 border-t border-slate-100">
      <ParallaxOrbs
        orbs={defaultOrbs.map((o) => ({ ...o, opacity: 0.6 }))}
      />
      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {classPrograms.map((c, i) => (
            <Reveal key={c.title} direction="up" delay={i * 100}>
              <Parallax speed={c.speed}>
                <div
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: "rgba(14,97,135,0.1)" }}
                  >
                    <c.icon size={28} style={{ color: BRAND }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              </Parallax>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
