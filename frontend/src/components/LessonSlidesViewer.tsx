import { useState } from 'react'
import { ChevronLeft, ChevronRight, Image } from 'lucide-react'

export interface SlideView {
  id: number
  name: string
  url: string
}

export default function LessonSlidesViewer({ slides }: { slides: SlideView[] }) {
  const [idx, setIdx] = useState(0)

  if (!slides || slides.length === 0) return null
  const total = slides.length
  const current = slides[Math.min(idx, total - 1)]

  const go = (next: number) => {
    if (next < 0 || next >= total) return
    setIdx(next)
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80">
        <div className="flex items-center gap-2 text-slate-300">
          <Image size={13} className="text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wide">Slide Materi</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{idx + 1} / {total}</span>
      </div>

      <div className="relative">
        <img
          src={current.url}
          alt={current.name}
          className="w-full h-auto max-h-[420px] object-contain bg-slate-900"
        />
        {total > 1 && (
          <>
            <button
              onClick={() => go(idx - 1)}
              disabled={idx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(idx + 1)}
              disabled={idx === total - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Slide berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-1.5 px-3 py-2.5 bg-slate-800/80 overflow-x-auto">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                i === idx ? 'border-emerald-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}