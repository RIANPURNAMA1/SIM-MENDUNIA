import { useEffect, useRef, useState } from "react";
import Reveal from "../../components/Reveal";
import Parallax from "../../components/Parallax";

const stats = [
  { value: "500+", label: "Alumni Berhasil", target: 500, suffix: "+", isPercent: false },
  { value: "95%", label: "Tingkat Kelulusan", target: 95, suffix: "%", isPercent: true },
  { value: "5", label: "Program Tersedia", target: 5, suffix: "", isPercent: false },
  { value: "4.9★", label: "Rating Peserta", target: 4.9, suffix: "★", isPercent: false },
];

function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [startOnView, started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, ref };
}

function StatItem({ s }: { s: (typeof stats)[number] }) {
  const { count, ref } = useCountUp(s.target, 2000, true);

  const display =
    s.isPercent || s.target % 1 !== 0
      ? count.toFixed(s.target % 1 === 0 ? 0 : 1)
      : Math.floor(count);

  return (
    <div ref={ref} className="py-8 px-4 text-center">
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#0069B0" }}>
        {display}
        {s.suffix}
      </div>
      <div className="text-xs md:text-sm text-slate-500 mt-1.5">{s.label}</div>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <section className="relative z-10 -mt-10 mb-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Parallax speed={-0.06}>
          <Reveal direction="up" delay={100}>
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 bg-white">
                {stats.map((s, i) => (
                  <Reveal key={s.label} direction="up" delay={i * 120}>
                    <StatItem s={s} />
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </Parallax>
      </div>
    </section>
  );
}
