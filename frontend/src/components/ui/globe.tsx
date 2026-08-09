import { useEffect, useRef } from "react";

const TEXTURE_URL = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const DEG_SEC = 16;
const TILT = -0.18;
const DOT_COUNT = 1700;

interface Pt {
  lon: number;
  lat: number;
  seed: number;
}

export default function Earth({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let seed = 8891;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const pts: Pt[] = [];
    for (let i = 0; i < DOT_COUNT; i += 1) {
      const lon = rand() * Math.PI * 2;
      const lat = Math.asin(2 * rand() - 1);
      pts.push({ lon, lat, seed: rand() });
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = TEXTURE_URL;

    let mask: Uint8Array = new Uint8Array(0);
    let land: Uint8Array = new Uint8Array(0);
    let texW = 0;
    let texH = 0;

    const buildMask = () => {
      try {
        const c2 = document.createElement("canvas");
        c2.width = 256;
        c2.height = 128;
        const c2x = c2.getContext("2d", { willReadFrequently: true });
        if (!c2x) return;
        c2x.drawImage(img, 0, 0, 256, 128);
        const d = c2x.getImageData(0, 0, 256, 128).data;
        const m = new Uint8Array(256 * 128);
        for (let i = 0; i < m.length; i += 1) {
          const r = d[i * 4];
          const g = d[i * 4 + 1];
          const b = d[i * 4 + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          m[i] = lum > 92 ? 255 : 0;
        }
        land = m;
        texW = 256;
        texH = 128;
      } catch {
        /* texture unreadable — treat all as ocean */
      }
    };
    img.onload = buildMask;
    img.onerror = () => {};

    const isLand = (lon: number, lat: number) => {
      if (texW === 0) return false;
      const u = ((lon / (2 * Math.PI)) % 1 + 1) % 1;
      const v = lat / Math.PI + 0.5;
      const ix = Math.floor(u * texW);
      const iy = Math.min(texH - 1, Math.max(0, Math.floor(v * texH)));
      return land[iy * texW + ix] === 255;
    };

    let raf = 0;

    const tick = (time: number) => {
      const rotDeg = ((((time / 1000) * DEG_SEC - 60) % 360) + 360) % 360;
      const a = (rotDeg * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const ct = Math.cos(TILT);
      const st = Math.sin(TILT);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.5;

      ctx.clearRect(0, 0, w, h);

      // soft sphere base so dots read on any background
      const base = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.38, R * 0.12, cx, cy, R);
      base.addColorStop(0, "rgba(14,52,104,0.85)");
      base.addColorStop(0.55, "rgba(8,30,72,0.9)");
      base.addColorStop(1, "rgba(3,12,36,0.95)");
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // scattered dots
      for (const p of pts) {
        const co = Math.cos(p.lon);
        const si = Math.sin(p.lon);
        const cl = Math.cos(p.lat);
        const y0 = Math.sin(p.lat);

        const x0 = cl * co;
        const z0 = cl * si;

        const x = x0 * ca + z0 * sa;
        const z = -x0 * sa + z0 * ca;
        if (z <= 0.02) continue;

        const wZ = z * ct + y0 * st;
        if (wZ <= 0.02) continue;

        const sx = cx + x * R;
        const sy = cy - (y0 * ct - z * st) * R;

        const landP = isLand(p.lon + a, p.lat);
        const depth = 0.4 + 0.6 * Math.abs(wZ);
        const twinkle = 0.85 + 0.15 * Math.sin(time / 1400 + p.seed * 8);

        if (landP) {
          ctx.globalAlpha = 0.08 * depth * twinkle;
          ctx.fillStyle = "#7cc9ff";
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.95 * depth * twinkle;
          ctx.fillStyle = "#d8f3ff";
          ctx.beginPath();
          ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 0.1 * depth * twinkle;
          ctx.fillStyle = "#6ab1ff";
          ctx.beginPath();
          ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // limb ring
      ctx.strokeStyle = "rgba(120,180,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // soft atmosphere
      const atm = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.25);
      atm.addColorStop(0, "rgba(70,130,220,0)");
      atm.addColorStop(0.7, "rgba(70,130,220,0.08)");
      atm.addColorStop(1, "rgba(70,130,220,0)");
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // gloss highlight
      const gloss = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.05, cx, cy, R * 0.95);
      gloss.addColorStop(0, "rgba(255,255,255,0.12)");
      gloss.addColorStop(0.3, "rgba(255,255,255,0.03)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const side = Math.max(1, Math.max(canvas.clientWidth, canvas.clientHeight) * dpr);
      canvas.width = side;
      canvas.height = side;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-[radial-gradient(rgba(125,170,255,0.14)_1px,transparent_1px)] bg-[length:20px_20px]"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full rounded-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}