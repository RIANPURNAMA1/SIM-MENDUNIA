import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import Reveal from "../../components/Reveal";
import Parallax from "../../components/Parallax";
import { useParallax } from "../../hooks/useParallax";

const BRAND = "#0E6187";

const programs = [
  {
    country: "Jepang",
    title: "Program Bahasa Jepang",
    slug: "program-bahasa-jepang",
    description:
      "Pelatihan bahasa & budaya Jepang, persiapan lulus JFT A2 Basic hingga siap kerja di Jepang.",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-10.png",
    shortDesc: "Program bahasa & budaya Jepang, persiapan JFT A2 Basic sampai siap kerja.",
    cardSpeed: -0.05,
    imgSpeed: 0.12,
  },
  {
    country: "Korea Selatan",
    title: "Program Bahasa Korea",
    slug: "program-bahasa-korea",
    description:
      "Pelatihan intensif 3 bulan plus 1 bulan pemantapan untuk persiapan ujian EPS-TOPIK.",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-12.png",
    shortDesc: "Program intensif persiapan EPS-TOPIK dan pendampingan kerja ke Korea.",
    cardSpeed: 0.05,
    imgSpeed: -0.1,
  },
];

function ParallaxCover({ image, alt, imgSpeed, onZoom }: { image: string; alt: string; imgSpeed: number; onZoom: () => void }) {
  const imgRef = useParallax<HTMLImageElement>(imgSpeed);
  return (
    <div className="relative h-56 md:h-64 w-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <img
          ref={imgRef}
          src={image}
          alt={alt}
          loading="lazy"
          className="absolute inset-x-0 -top-[15%] h-[130%] w-full object-cover cursor-zoom-in"
          style={{ willChange: "transform" }}
          onClick={onZoom}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
}

interface ProgramDetailProps {
  companyName: string;
  waNumber: string;
}

export default function ProgramDetail({ companyName }: ProgramDetailProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState<string>("");

  return (
    <section id="program" className="relative overflow-hidden py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Reveal direction="up">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Program Kelas Di <span className="text-[#0E6187]">{companyName}</span>
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Pilih program yang sesuai dengan tujuanmu dan mulai perjalanan kariermu di luar negeri.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((prog, i) => (
            <Reveal key={prog.country} direction={i % 2 === 0 ? "left" : "right"} delay={i * 120}>
              <Parallax speed={prog.cardSpeed}>
                <div
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
                >
                  <ParallaxCover
                    image={prog.image}
                    alt={prog.title}
                    imgSpeed={prog.imgSpeed}
                    onZoom={() => {
                      setPreviewImage(prog.image);
                      setPreviewAlt(prog.title);
                    }}
                  />
                  <div className="p-6 md:p-8">
                    <p
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
                      style={{ backgroundColor: "rgba(14,97,135,0.08)", color: BRAND }}
                    >
                      {prog.country}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">{prog.shortDesc}</p>
                    <Link
                      to={`/program/${prog.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                      style={{ backgroundColor: "#f9b700", color: "#000000" }}
                    >
                      Lihat Selengkapnya <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </Parallax>
            </Reveal>
          ))}
        </div>
      </div>

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
    </section>
  );
}
