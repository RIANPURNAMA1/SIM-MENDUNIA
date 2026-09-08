import { useRef } from 'react'
import { FileText, ImagePlus, Trash2, UploadCloud, X } from 'lucide-react'

export interface LessonSlideItem {
  key: string
  id?: number
  url?: string
  file?: File
  name: string
  size?: number
}

export const fmtFileSize = (size?: number) => {
  if (!size) return ''
  return size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'

interface Props {
  pdfName?: string | null
  pdfSize?: number | null
  slides: LessonSlideItem[]
  uploading?: boolean
  onPdf: (file: File | null) => void
  onRemovePdf: () => void
  onSlidesChange: (slides: LessonSlideItem[]) => void
}

export default function LessonMediaFields({ pdfName, pdfSize, slides, uploading, onPdf, onRemovePdf, onSlidesChange }: Props) {
  const pdfRef = useRef<HTMLInputElement>(null)
  const slideRef = useRef<HTMLInputElement>(null)

  const pickPdf = () => pdfRef.current?.click()
  const pickSlides = () => slideRef.current?.click()

  const handlePdf = (file: File | null) => {
    onPdf(file)
    if (pdfRef.current) pdfRef.current.value = ''
  }

  const handleSlides = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const next = Array.from(files).map(file => ({
      key: `new-${Date.now()}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }))
    onSlidesChange([...slides, ...next])
    if (slideRef.current) slideRef.current.value = ''
  }

  const removeSlide = (key: string) => {
    onSlidesChange(slides.filter(s => s.key !== key))
  }

  return (
    <div className="space-y-4">
      {/* Materi PDF */}
      <div>
        <label className={labelCls}>Materi PDF</label>
        <input
          ref={pdfRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => handlePdf(e.target.files?.[0] || null)}
        />
        {pdfName ? (
          <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{pdfName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{fmtFileSize(pdfSize) || 'Materi PDF'}</p>
            </div>
            <button
              type="button"
              onClick={onRemovePdf}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0"
              title="Hapus PDF"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickPdf}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 hover:border-[#0E6187]/40 hover:bg-[#0E6187]/[0.03] rounded-lg py-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0E6187] transition-colors disabled:opacity-50"
          >
            <UploadCloud size={16} />
            {uploading ? 'Mengupload...' : 'Pilih file PDF (opsional)'}
          </button>
        )}
        <p className="text-[10px] text-slate-400 mt-1">Format .pdf maksimal 50 MB</p>
      </div>

      {/* Slide Image */}
      <div>
        <label className={labelCls}>Slide Gambar</label>
        <input
          ref={slideRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={e => handleSlides(e.target.files)}
        />

        {slides.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {slides.map((slide, idx) => (
              <div key={slide.key} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img src={slide.url} alt={slide.name} className="w-full h-16 object-cover" />
                <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-black/50 rounded px-1 py-0.5">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSlide(slide.key)}
                  className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  title="Hapus slide"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={pickSlides}
          disabled={uploading}
          className="w-full border-2 border-dashed border-slate-200 hover:border-[#0E6187]/40 hover:bg-[#0E6187]/[0.03] rounded-lg py-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0E6187] transition-colors disabled:opacity-50"
        >
          <ImagePlus size={16} />
          {uploading ? 'Mengupload...' : 'Pilih slide gambar (bisa lebih dari satu)'}
        </button>
        <p className="text-[10px] text-slate-400 mt-1">Format JPG / PNG / WEBP, misalnya hasil ekspor slide presentasi</p>
      </div>
    </div>
  )
}