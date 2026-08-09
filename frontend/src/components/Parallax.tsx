import { ReactNode } from "react";
import { useParallax } from "../hooks/useParallax";

interface ParallaxProps {
  speed?: number;
  className?: string;
  children: ReactNode;
}

export default function Parallax({ speed = 0.15, className = "", children }: ParallaxProps) {
  const ref = useParallax<HTMLDivElement>(speed);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}