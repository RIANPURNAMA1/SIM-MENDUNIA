import { useEffect, useRef } from "react";

const DEG_SEC = 12;
const TILT = -0.2;

function to3d(lonDeg: number, latDeg: number): [number, number, number] {
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
}

interface ArcDef {
  A: [number, number, number];
  B: [number, number, number];
  C: [number, number, number];
  dur: number;
  offset: number;
  color: string;
}

const NODES = [
  { color: "#f9b700", lon: 106.8, lat: -6.2 },     // Indonesia (hub)
  { color: "#38bdf8", lon: 103.8, lat: 1.35 },    // Singapura
  { color: "#38bdf8", lon: 101.7, lat: 3.1 },     // Malaysia
  { color: "#38bdf8", lon: 100.5, lat: 13.7 },    // Thailand
  { color: "#38bdf8", lon: 106.8, lat: 21 },      // Vietnam
  { color: "#38bdf8", lon: 121, lat: 14.6 },      // Filipina
  { color: "#f9b500", lon: 139.7, lat: 35.7 },    // Jepang
  { color: "#f9b500", lon: 126.9, lat: 37.6 },    // Korea
];

const LINKS: Array<[number, number]> = [
  [5, 0], [3, 0], [1, 0], [2, 0], [4, 0], [6, 0], [7, 0],
  [6, 5], [7, 6], [4, 1], [2, 3],
];

export default function GlobeWorld({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // faint static dots (ocean sparkle)
    const faint: Array<[number, number, number]> = [];
    let seed = 2026;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 360; i += 1) {
      const lon = (rand() * 360 - 180) * (Math.PI / 180);
      const lat = Math.asin(2 * rand() - 1);
      faint.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]);
    }

    const nodeV = NODES.map((n) => to3d(n.lon, n.lat));

    const control = (A: [number, number, number], B: [number, number, number]): [number, number, number] => {
      const CX = (A[0] + B[0]) / 2;
      const CY = (A[1] + B[1]) / 2;
      const CZ = (A[2] + B[2]) / 2;
      const cl = Math.sqrt(CX * CX + CY * CY + CZ * CZ) || 1;
      const lift = 0.7;
      return [(CX / cl) * (1 + lift), (CY / cl) * (1 + lift), (CZ / cl) * (1 + lift)];
    };

    const arcs: ArcDef[] = LINKS.map(([i, j], idx) => ({
      A: nodeV[i],
      B: nodeV[j],
      C: control(nodeV[i], nodeV[j]),
      dur: 4600 + (idx % 5) * 900,
      offset: (idx * 1310) % 9000,
      color: NODES[i].color,
    }));

    const bez = (
      arc: ArcDef,
      t: number
    ): [number, number, number] => {
      const u = 1 - t;
      return [
        u * u * arc.A[0] + 2 * u * t * arc.C[0] + t * t * arc.B[0],
        u * u * arc.A[1] + 2 * u * t * arc.C[1] + t * t * arc.B[1],
        u * u * arc.A[2] + 2 * u * t * arc.C[2] + t * t * arc.B[2],
      ];
    };

    let raf = 0;

    const tick = (time: number) => {
      const rotDeg = (((time / 1000) * DEG_SEC - 205) % 360 + 360) % 360;
      const a = (rotDeg * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const tilt = TILT;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.41;

      const project = (p: [number, number, number]): [number, number, number] => {
        const x = p[0] * ca + p[2] * sa;
        const z = -p[0] * sa + p[2] * ca;
        const wY = p[1] * ct - z * st;
        const wZ = z * ct + p[1] * st;
        return [cx + x * R, cy - wY * R, wZ];
      };

      ctx.clearRect(0, 0, w, h);

      // sphere base
      const base = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.4, R * 0.1, cx, cy, R);
      base.addColorStop(0, "rgba(18,72,132,1)");
      base.addColorStop(0.55, "rgba(10,40,88,0.98)");
      base.addColorStop(1, "rgba(4,15,40,0.97)");
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // faint scatter dots
      for (const p of faint) {
        const pr = project(p);
        if (pr[2] <= 0) continue;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#93d2ff";
        ctx.fillRect(pr[0], pr[1], 1.3, 1.3);
      }
      ctx.globalAlpha = 1;

      // ghost arcs (static faint connections)
      for (const arc of arcs) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= 1.0001; s += 0.035) {
          const p = project(bez(arc, s));
          if (p[2] <= 0) {
            started = false;
            continue;
          }
          if (!started) {
            started = true;
            ctx.moveTo(p[0], p[1]);
          } else {
            ctx.lineTo(p[0], p[1]);
          }
        }
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // traveling pulse along arcs
      for (const arc of arcs) {
        const prog = ((time + arc.offset) % arc.dur) / arc.dur;
        if (prog <= 0) continue;
        const tail = Math.max(0, prog - 0.22);

        ctx.beginPath();
        let started = false;
        for (let s = tail; s <= prog; s += 0.02) {
          const p = project(bez(arc, s));
          if (p[2] <= 0) {
            started = false;
            continue;
          }
          if (!started) {
            started = true;
            ctx.moveTo(p[0], p[1]);
          } else {
            ctx.lineTo(p[0], p[1]);
          }
        }
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1.7;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 9;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // head glow
        const head = project(bez(arc, prog));
        if (head[2] > 0) {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = arc.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(head[0], head[1], 2.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;

      // country nodes
      for (let n = 0; n < NODES.length; n += 1) {
        const pr = project(nodeV[n]);
        if (pr[2] <= 0) continue;
        const pulse = 0.5 + 0.5 * Math.sin(time / 400 + n * 1.7);
        const halo = 8 + pulse * 4;
        const g = ctx.createRadialGradient(pr[0], pr[1], 0, pr[0], pr[1], halo);
        g.addColorStop(0, NODES[n].color + "66");
        g.addColorStop(1, NODES[n].color + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pr[0], pr[1], halo, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = NODES[n].color;
        ctx.beginPath();
        ctx.arc(pr[0], pr[1], 3.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pr[0], pr[1], 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // gloss
      const gloss = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.05, cx, cy, R * 0.95);
      gloss.addColorStop(0, "rgba(255,255,255,0.1)");
      gloss.addColorStop(0.3, "rgba(255,255,255,0.02)");
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

  return <canvas ref={canvasRef} className={className} style={{ touchAction: "none" }} />;
}