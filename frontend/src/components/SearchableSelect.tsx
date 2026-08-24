import { useMemo, useState } from "react";

interface Option {
  id: number | string;
  label: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  buttonClassName?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih",
  searchPlaceholder = "Cari...",
  buttonClassName = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find(o => String(o.id) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 text-left ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? "" : "text-gray-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full border-b border-gray-100 px-3 py-2 text-sm outline-none"
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(String(o.id)); setOpen(false); setQuery(""); }}
                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    String(o.id) === String(value) ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">Tidak ditemukan</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
