import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import AnimateInView from "../../components/AnimateInView";
import Reveal from "../../components/Reveal";

const BRAND = "#0E6187";

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

export default function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
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
  );
}
