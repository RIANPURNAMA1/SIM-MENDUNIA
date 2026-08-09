import { useParallax } from "../../hooks/useParallax";

interface OrbCfg {
  className: string;
  color: string;
  speed: number;
  blur: number;
}

interface ParallaxOrbsProps {
  orbs: OrbCfg[];
  className?: string;
}

function Orb({ o }: { o: OrbCfg }) {
  const ref = useParallax<HTMLDivElement>(o.speed);
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute rounded-full ${o.className}`}
      style={{
        backgroundColor: o.color,
        filter: `blur(${o.blur}px)`,
        willChange: "transform",
      }}
    />
  );
}

export default function ParallaxOrbs({ orbs, className = "" }: ParallaxOrbsProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {orbs.map((o, i) => (
        <Orb key={i} o={o} />
      ))}
    </div>
  );
}

export const defaultOrbs: OrbCfg[] = [
  { className: "top-6 -left-16 w-72 h-72", color: "rgba(14,97,135,0.10)", speed: -0.08, blur: 60 },
  { className: "top-1/3 -right-20 w-80 h-80", color: "rgba(14,97,135,0.12)", speed: 0.12, blur: 70 },
  { className: "bottom-10 -left-10 w-56 h-56", color: "rgba(250,204,21,0.16)", speed: 0.05, blur: 50, },
  { className: "bottom-32 right-16 w-40 h-40", color: "rgba(14,97,135,0.08)", speed: -0.05, blur: 40 },
];