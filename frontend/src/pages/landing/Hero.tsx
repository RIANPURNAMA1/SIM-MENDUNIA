import { useRef, useEffect, useState } from "react";
import { ChevronRight, Phone, Users, Award, Globe } from "lucide-react";
import Earth from "@/components/ui/globe";

const BRAND = "#0069b0";

const txt = {
  badge: "Lembaga Pelatihan & Penempatan Kerja",
  title1: "Peluang Kerja",
  titleHighlight: "Jepang & Korea Selatan",
  subtitle:
    "Kami bersamai sampai kamu bisa Sukses Kerja ke Jepang dan Korea Selatan melalui pelatihan bahasa, budaya, dan persiapan kerja yang profesional.",
  btnProgram: "Lihat Program",
  btnKonsultasi: "Konsultasi Gratis",
  stat1: { value: "500+", label: "Alumni Bekerja" },
  stat2: { value: "10–12", label: "Bulan Proses" },
  stat3: { value: "100%", label: "Garansi Lulus" },
  pinJapan: "Jepang",
  pinKorea: "Korea",
  pinIndonesia: "Indonesia",
  cardLabel: "Alumni Berangkat",
};

export default function HeroSection({ waNumber }: { waNumber: string }) {
  const [offsetY, setOffsetY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [shine, setShine] = useState(0);
  const [shineProgram, setShineProgram] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const sectionTop = rect.top + scrollTop;
      const diff = scrollTop - sectionTop;
      if (diff > -window.innerHeight && diff < window.innerHeight) {
        setOffsetY(diff);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} id="beranda" className="relative overflow-hidden" style={{ backgroundColor: BRAND }}>

      {/* Grid background - slow parallax */}
      <div
        className="absolute inset-0 bg-grid-light [mask-image:radial-gradient(ellipse_80%_80%_at_50%_100%,black_30%,transparent_70%)]"
        style={{ transform: `translateY(${offsetY * 0.15}px)` }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Kiri: Teks - slight parallax */}
          <div style={{ transform: `translateY(${offsetY * 0.05}px)` }}>
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-6 backdrop-blur-sm transition-all duration-700 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {txt.badge}
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-5 leading-tight transition-all duration-700 ease-out delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {txt.title1}
              <br />
              di <span className="text-[#f9b700]">{txt.titleHighlight}</span>
            </h1>

            <p
              className={`text-lg md:text-xl text-blue-100/90 max-w-xl mb-8 leading-relaxed transition-all duration-700 ease-out delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {txt.subtitle}
            </p>

            <div
              className={`flex flex-col sm:flex-row gap-3 mb-10 transition-all duration-700 ease-out delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <a
                href="#program"
                onMouseEnter={() => setShineProgram((s) => s + 1)}
                className="btn-shine inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm rounded-sm active:scale-95 transition-all"
              >
                {shineProgram > 0 && <span key={shineProgram} className="btn-shine-streak btn-shine-streak-dark" />}
                {txt.btnProgram}
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => setShine((s) => s + 1)}
                className="btn-shine inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f9b700] hover:bg-[#fbbf0b] text-black font-bold text-sm rounded-sm active:scale-95 transition-all shadow-[0_4px_18px_rgba(249,183,0,0.35)] hover:shadow-[0_6px_26px_rgba(249,183,0,0.55)]"
              >
                {shine > 0 && <span key={shine} className="btn-shine-streak" />}
                <Phone className="w-4 h-4" />
                {txt.btnKonsultasi}
              </a>
            </div>

            {/* Stats */}
            <div
              className={`flex flex-wrap items-center gap-x-6 gap-y-3 transition-all duration-700 ease-out delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {[
                { icon: Users, value: txt.stat1.value, label: txt.stat1.label },
                { icon: Award, value: txt.stat2.value, label: txt.stat2.label },
                { icon: Globe, value: txt.stat3.value, label: txt.stat3.label },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  <div>
                    <div className="text-base font-extrabold text-white leading-none">
                      {value}
                    </div>
                    <div className="text-xs text-blue-200/70 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: Globe - faster parallax */}
          <div
            className={`relative flex items-center justify-center transition-all duration-1000 ease-out delay-200 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
            style={{ transform: `translateY(${offsetY * -0.1}px)` }}
          >
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-[34rem] lg:h-[34rem]">

{/* Globe */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-900/50 relative">

                <Earth className="absolute inset-0 h-full w-full" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(circle at 50% 30%, transparent 55%, rgba(1,10,30,0.45) 96%)" }}
                />

                {/* Person photo (front) */}
                <div className="absolute inset-0 flex items-end justify-center z-[3]">
                  <div className="w-full h-full">
                    <img
                      src="models.png"
                      alt="Calon pekerja Mendunia berdiri di depan globe dunia untuk kerja di Jepang dan Korea Selatan"
                      width={400}
                      height={450}
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-full object-contain object-bottom"
                    />
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none z-[4]" />
              </div>

              {/* Orbiting dots */}
              <div className="absolute top-6 right-5 w-2 h-2 rounded-full bg-yellow-400 animate-ping opacity-40" />
              <div className="absolute bottom-10 left-8 w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping opacity-30" style={{ animationDelay: "1s" }} />

              {/* Country pins */}
              <div className="absolute -top-3 left-4 bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-sm border border-slate-100 backdrop-blur-sm">
                <img src="https://flagcdn.com/20x15/jp.png" alt="" className="w-5 h-3.5 rounded-sm object-cover" />
                {txt.pinJapan}
              </div>
              <div className="absolute top-8 -right-4 bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-sm border border-slate-100 backdrop-blur-sm">
                <img src="https://flagcdn.com/20x15/kr.png" alt="" className="w-5 h-3.5 rounded-sm object-cover" />
                {txt.pinKorea}
              </div>
              <div className="absolute bottom-12 -left-6 bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-sm border border-slate-100 backdrop-blur-sm">
                <img src="https://flagcdn.com/20x15/id.png" alt="" className="w-5 h-3.5 rounded-sm object-cover" />
                {txt.pinIndonesia}
              </div>

              {/* Feature card */}
              <div className="absolute -bottom-4 -right-4 bg-white/90 rounded-xl p-3.5 shadow-sm border border-slate-100 min-w-[130px] backdrop-blur-sm">
                <div className="text-xl font-extrabold" style={{ color: BRAND }}>
                  {txt.stat1.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{txt.cardLabel}</div>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <img
                      key={n}
                      src={`https://i.pravatar.cc/40?img=${n}`}
                      alt=""
                      className="w-5 h-5 rounded-full border-2 border-white -ml-1 first:ml-0 object-cover"
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1.5 self-center">+</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
