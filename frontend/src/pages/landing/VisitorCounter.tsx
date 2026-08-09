import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { visitorApi } from "../../services/api";

const VISITOR_KEY = "mendunia_visitor_key";
const VISITOR_RECORDED = "mendunia_visitor_recorded";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}rb`;
  return n.toString();
}

export default function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        let visitorKey = localStorage.getItem(VISITOR_KEY);
        if (!visitorKey) {
          visitorKey =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          localStorage.setItem(VISITOR_KEY, visitorKey);
        }

        if (!sessionStorage.getItem(VISITOR_RECORDED)) {
          sessionStorage.setItem(VISITOR_RECORDED, "1");
          await visitorApi.record(visitorKey);
        }

        const res = await visitorApi.stats();
        setTotal(res.data?.data?.total ?? res.data?.total ?? 0);
      } catch {
        setTotal(null);
      }
    };

    init();
    const interval = setInterval(() => {
      visitorApi
        .stats()
        .then((res) => setTotal(res.data?.data?.total ?? res.data?.total ?? null))
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  if (total === null) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs backdrop-blur-sm">
      <Eye className="w-4 h-4 text-[#f9b700]" />
      <span className="font-bold text-white">{formatNumber(total)}</span>
      <span>pengunjung telah melihat situs ini</span>
    </div>
  );
}