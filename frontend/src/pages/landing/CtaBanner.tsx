import { ArrowRight, Sparkles } from "lucide-react";
import Reveal from "../../components/Reveal";

const BRAND = "#0E6187";

export default function CtaBanner({ waNumber }: { waNumber: string }) {
  return (
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
  );
}
