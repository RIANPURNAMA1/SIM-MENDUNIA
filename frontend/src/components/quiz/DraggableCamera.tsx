import { useRef, useState } from 'react'
import { GripHorizontal, MoveDiagonal, Video, VideoOff } from 'lucide-react'

interface DraggableCameraProps {
  cameraRef: React.RefObject<HTMLVideoElement | null>
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>
  cameraActive: boolean
  faceMissing: boolean
  headTurned: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const defaultSize = () => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
  return isDesktop ? { w: 192, h: 128 } : { w: 160, h: 112 }
}

export default function DraggableCamera({ cameraRef, overlayCanvasRef, cameraActive, faceMissing, headTurned }: DraggableCameraProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const resizeHandleRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState<{ w: number; h: number }>(defaultSize)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const resizeRef = useRef<{ pointerId: number; startX: number; startY: number; baseW: number; baseH: number; ratio: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: rect.left, baseY: rect.top }
    setDragging(true)
    try {
      containerRef.current.setPointerCapture(e.pointerId)
    } catch {}
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const el = containerRef.current
    const w = el?.offsetWidth ?? 0
    const h = el?.offsetHeight ?? 0
    const x = clamp(drag.baseX + (e.clientX - drag.startX), 0, Math.max(0, window.innerWidth - w))
    const y = clamp(drag.baseY + (e.clientY - drag.startY), 0, Math.max(0, window.innerHeight - h))
    setPos({ x, y })
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !resizeHandleRef.current) return
    e.stopPropagation()
    resizeRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseW: size.w, baseH: size.h, ratio: size.w / size.h }
    setResizing(true)
    try {
      resizeHandleRef.current.setPointerCapture(e.pointerId)
    } catch {}
  }

  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = resizeRef.current
    if (!r || r.pointerId !== e.pointerId) return
    const dx = e.clientX - r.startX
    const maxW = Math.min(360, window.innerWidth - 24, (window.innerHeight - 24) * r.ratio)
    const nextW = clamp(r.baseW + dx, 88, Math.max(88, maxW))
    setSize({ w: nextW, h: Math.round(nextW / r.ratio) })
  }

  const endResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current?.pointerId !== e.pointerId) return
    resizeRef.current = null
    setResizing(false)
  }

  const videoBlock = (
    <div className="relative">
      <video
        ref={cameraRef}
        muted
        playsInline
        autoPlay
        className="object-cover"
        style={{ width: size.w, height: size.h, transform: 'scaleX(-1)' }}
      />
      <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <span className={`absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white/60 ${faceMissing ? 'bg-red-500' : cameraActive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
      <span className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-center text-[9px] font-bold text-white ${headTurned ? 'bg-red-500/80' : faceMissing ? 'bg-red-500/80' : cameraActive ? 'bg-black/50' : 'bg-black/60'}`}>
        {headTurned ? 'Menoleh' : faceMissing ? 'Tak terdeteksi' : cameraActive ? 'Wajah OK' : 'Menghubungkan kamera...'}
      </span>
    </div>
  )

  if (minimized) {
    return (
      <>
        <div className="pointer-events-none fixed left-[-9999px] top-0 z-0 opacity-0" aria-hidden="true">
          {videoBlock}
        </div>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full bg-[#1f2022]/90 px-3 py-2 text-white shadow-xl ring-1 ring-white/20 transition-colors hover:bg-[#1f2022]"
          title="Tampilkan kamera pengawas"
        >
          <Video size={15} className="text-emerald-400" />
          <span className="text-[11px] font-bold">Kamera pengawas</span>
        </button>
      </>
    )
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="fixed z-[80] touch-none select-none"
      style={{
        top: pos ? pos.y : undefined,
        left: pos ? pos.x : undefined,
        bottom: pos ? undefined : 96,
        right: pos ? undefined : 12,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      <div className={`overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/25 ${dragging ? 'ring-white/50' : ''} ${resizing ? 'ring-amber-300/70' : ''}`}>
        <div className="flex items-center justify-between gap-2 bg-[#1f2022] px-2 py-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/85">
            <Video size={11} className="text-emerald-400" />
            Kamera Pengawas
          </span>
          <span className="hidden items-center gap-1 text-[9px] font-medium text-white/45 md:flex">
            <GripHorizontal size={12} />
            Geser
          </span>
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setMinimized(true) }}
            className="rounded p-0.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Sembunyikan kamera (pengawasan tetap aktif)"
          >
            <VideoOff size={13} />
          </button>
        </div>
        {videoBlock}
        <div
          ref={resizeHandleRef}
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-nwse-resize items-center justify-center"
          title="Ubah ukuran kamera (seret sudut)"
        >
          <MoveDiagonal size={13} className="text-white/70" />
        </div>
      </div>
    </div>
  )
}