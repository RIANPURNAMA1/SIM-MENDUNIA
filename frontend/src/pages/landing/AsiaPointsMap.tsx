import { useEffect, useRef } from "react";

const LON_MIN = 93;
const LON_MAX = 165;
const LAT_MIN = -6;
const LAT_MAX = 45;

const NODES = [
  { color: "#f9b700", lon: 106.8, lat: -6.2, label: "Indonesia" },
  { color: "#38bdf8", lon: 103.8, lat: 1.35, label: "Singapura" },
  { color: "#38bdf8", lon: 101.7, lat: 3.1, label: "Malaysia" },
  { color: "#38bdf8", lon: 100.5, lat: 13.7, label: "Thailand" },
  { color: "#38bdf8", lon: 106.8, lat: 21, label: "Vietnam" },
  { color: "#38bdf8", lon: 121, lat: 14.6, label: "Filipina" },
  { color: "#f9b500", lon: 139.7, lat: 35.7, label: "Jepang" },
  { color: "#f9b500", lon: 126.9, lat: 37.6, label: "Korea" },
];

const LINKS: Array<[number, number]> = [
  [5, 0], [3, 0], [1, 0], [2, 0], [4, 0], [6, 0], [7, 0],
  [6, 5], [7, 6], [4, 1], [2, 3],
];

export default function AsiaPointsMap({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let seed = 7;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // faint scattered dot field
    const dots: Array<[number, number, number]> = Array.from({ length: 420 }, () => [
      rand() * 2 - 1,
      rand() * 2 - 1,
      rand(),
    ]);

    const pos = NODES.map((n) => {
      const lon = n.lon;
      const lat = n.lat;
      return {
        x: 0,
        y: 0,
        nx: (lon - LON_MIN) / (LON_MAX - LON_MIN),
        ny: (LAT_MAX - lat) / (LAT_MAX - LAT_MIN),
      };
    });

    const arcs = LINKS.map(([i, j], idx) => ({
      a: i,
      b: j,
      dur: 4200 + (idx % 5) * 800,
      offset: (idx * 1150) % 8000,
      color: NODES[i].color,
    }));

    let raf = 0;

    const tick = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const pad = 14;

      const xAt = (u: number) => pad + u * (w - pad * 2);
      const yAt = (v: number) => pad + v * (h - pad * 2);

      for (const p of pos) {
        p.x = xAt(p.nx);
        p.y = yAt(p.ny);
      }

      ctx.clearRect(0, 0, w, h);

      // faint dot field
      for (const d of dots) {
        const dx = pad + ((d[0] + 1) / 2) * (w - pad * 2);
        const dy = pad + ((d[1] + 1) / 2) * (h - pad * 2);
        ctx.globalAlpha = 0.1 + d[2] * 0.14;
        ctx.fillStyle = "#7cc4ff";
        ctx.fillRect(dx, dy, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;

      const arcAt = (a: number, b: number, t: number) => {
        const pA = pos[a];
        const pB = pos[b];
        const mx = (pA.x + pB.x) / 2;
        const my = (pA.y + pB.y) / 2;
        const len = Math.hypot(pB.x - pA.x, pB.y - pA.y);
        const u = 1 - t;
        return {
          x: u * u * pA.x + 2 * u * t * mx + t * t * pB.x,
          y: u * u * pA.y + 2 * u * t * my + t * t * pB.y,
        };
      };

      // ghost lines
      for (const arc of arcs) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= 1.0001; s += 0.04) {
          const p = arcAt(arc.a, arc.b, s);
          if (!started) {
            started = true;
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // travelling pulses
      for (const arc of arcs) {
        const prog = ((time + arc.offset) % arc.dur) / arc.dur;
        if (prog <= 0) continue;
        const tail = Math.max(0, prog - 0.22);
        ctx.beginPath();
        let started = false;
        for (let s = tail; s <= prog; s += 0.025) {
          const p = arcAt(arc.a, arc.b, s);
          if (!started) {
            started = true;
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 1.7;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1;

        const head = arcAt(arc.a, arc.b, prog);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // nodes
      for (let n = 0; n < pos.length; n += 1) {
        const p = pos[n];
        const pulse = 0.5 + 0.5 * Math.sin(time / 380 + n * 1.7);
        const halo = 9 + pulse * 5;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
        g.addColorStop(0, NODES[n].color + "66");
        g.addColorStop(1, NODES[n].color + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, halo, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = NODES[n].color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // label
        ctx.font = `600 10px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.textAlign = "center";
        ctx.fillText(NODES[n].label, p.x, p.y + 14);
      }

      // top gloss
      const gloss = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.7);
      gloss.addColorStop(0, "rgba(255,255,255,0.10)");
      gloss.addColorStop(0.5, "rgba(255,255,255,0.02)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss;
      ctx.fillRect(0, 0, w, h);

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