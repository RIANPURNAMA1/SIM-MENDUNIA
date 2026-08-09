import { MessageCircle, Star } from "lucide-react";
import Reveal from "../../components/Reveal";
import ParallaxOrbs, { defaultOrbs } from "./ParallaxOrbs";

const BRAND = "#0E6187";

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

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 hover:shadow-md transition-all duration-300">
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
  );
}

export default function Testimonials() {
  return (
    <section id="testimoni" className="relative overflow-hidden py-16 md:py-20 bg-slate-50 border-y border-slate-200">
      <ParallaxOrbs
        orbs={defaultOrbs.map((o) => ({ ...o, opacity: 0.55 }))}
      />
      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
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
              <div
                className="absolute inset-x-0 top-0 h-40 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(248,250,252,1) 0%, rgba(248,250,252,0.9) 45%, rgba(248,250,252,0) 100%)" }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-40 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(248,250,252,1) 0%, rgba(248,250,252,0.9) 45%, rgba(248,250,252,0) 100%)" }}
              />
              <div
                className={col.direction === "up" ? "animate-marquee-up" : "animate-marquee-down"}
                style={{ animationDuration: `${col.duration}s` }}
              >
                {[...col.items, ...col.items].map((t, idx) => (
                  <TestimonialCard key={idx} t={t} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex-1 overflow-hidden relative h-[520px]">
            <div
              className="absolute inset-x-0 top-0 h-40 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(248,250,252,1) 0%, rgba(248,250,252,0.9) 45%, rgba(248,250,252,0) 100%)" }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-40 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(248,250,252,1) 0%, rgba(248,250,252,0.9) 45%, rgba(248,250,252,0) 100%)" }}
            />
            <div className="animate-marquee-up" style={{ animationDuration: "22s" }}>
              {[...testimonials, ...testimonials].map((t, idx) => (
                <TestimonialCard key={idx} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
