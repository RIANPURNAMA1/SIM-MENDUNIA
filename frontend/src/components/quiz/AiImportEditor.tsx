import { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

/**
 * Editor teks kaya untuk "Import dengan AI". Teks & gambar bisa di-paste langsung.
 * Gambar yang di-paste / di-drop / dipilih lewat toolbar langsung diunggah ke server
 * (bukan disimpan sebagai base64), lalu saat diproses posisinya diubah menjadi tag
 * [gambar:path] sehingga AI bisa menempelkannya ke soal/opsi yang tepat.
 */

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

interface Props {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
  /** Unggah file gambar, kembalikan path yang disimpan di soal. */
  uploadImage: (file: File) => Promise<string>
  /** Ubah path tersimpan menjadi URL yang bisa ditampilkan. */
  toDisplayUrl: (path: string) => string
  /** Peta URL tampilan -> path tersimpan (diisi editor, dibaca saat konversi). */
  pathMap: React.MutableRefObject<Map<string, string>>
  onUploadingChange?: (delta: number) => void
  onUploadError?: (file: File) => void
}

export default function AiImportEditor({
  value, onChange, disabled, placeholder, uploadImage, toDisplayUrl, pathMap, onUploadingChange, onUploadError,
}: Props) {
  // Simpan callback terbaru di ref agar `modules` tetap stabil (Quill tidak di-init ulang).
  const cb = useRef({ uploadImage, toDisplayUrl, onUploadingChange, onUploadError })
  cb.current = { uploadImage, toDisplayUrl, onUploadingChange, onUploadError }

  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['image'],
      ['clean'],
    ],
    uploader: {
      mimetypes: IMAGE_MIMES,
      async handler(this: { quill: any }, range: { index: number; length: number }, files: File[]) {
        const quill = this.quill
        let index = range.index
        if (range.length) quill.deleteText(range.index, range.length, 'user')
        for (const file of files) {
          cb.current.onUploadingChange?.(1)
          try {
            const path = await cb.current.uploadImage(file)
            const src = cb.current.toDisplayUrl(path)
            pathMap.current.set(src, path)
            quill.insertEmbed(index, 'image', src, 'user')
            index += 1
            quill.setSelection(index, 0, 'silent')
          } catch {
            cb.current.onUploadError?.(file)
          } finally {
            cb.current.onUploadingChange?.(-1)
          }
        }
      },
    },
  }), [pathMap])

  return (
    <div className="ai-import-editor bg-white [&_.ql-container]:min-h-[170px] [&_.ql-editor]:max-h-[45vh] [&_.ql-editor]:min-h-[170px] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:text-[13px] [&_.ql-editor_img]:my-1 [&_.ql-editor_img]:max-h-40 [&_.ql-editor_img]:border [&_.ql-editor_img]:border-[#e8def8]">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        readOnly={disabled}
        modules={modules}
        formats={['bold', 'italic', 'underline', 'list', 'image']}
        placeholder={placeholder}
      />
    </div>
  )
}

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'BLOCKQUOTE', 'PRE', 'TABLE', 'UL', 'OL'])

const dataUrlToFile = async (dataUrl: string, i: number): Promise<File> => {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
  return new File([blob], `paste-${Date.now()}-${i}.${ext}`, { type: blob.type || 'image/png' })
}

/**
 * Ubah HTML editor menjadi teks polos untuk AI. Setiap gambar menjadi tag
 * [gambar:path] di posisinya. Gambar base64 yang tersisa (mis. dari paste HTML)
 * diunggah dulu; gambar dari URL luar dipakai apa adanya.
 */
export async function aiEditorHtmlToText(
  html: string,
  pathMap: Map<string, string>,
  uploadImage: (file: File) => Promise<string>,
): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let out = ''
  let imgCount = 0
  const newline = () => { if (out && !out.endsWith('\n')) out += '\n' }

  const walk = async (node: Node): Promise<void> => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent || '').replace(/ /g, ' ')
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName

    if (tag === 'BR') { out += '\n'; return }
    if (tag === 'IMG') {
      const src = el.getAttribute('src') || ''
      let path = pathMap.get(src) || ''
      if (!path && src.startsWith('data:')) {
        path = await uploadImage(await dataUrlToFile(src, imgCount++))
        pathMap.set(src, path)
      }
      if (!path && /^https?:\/\//i.test(src)) path = src
      if (path) { newline(); out += `[gambar:${path}]\n` }
      return
    }
    if (tag === 'TD' || tag === 'TH') {
      for (const child of Array.from(el.childNodes)) await walk(child)
      out += '\t'
      return
    }

    const isBlock = BLOCK_TAGS.has(tag)
    if (isBlock) newline()
    if (tag === 'LI') {
      // Quill 2 memakai <ol><li data-list="ordered|bullet">.
      const list = el.getAttribute('data-list') || (el.parentElement?.tagName === 'OL' ? 'ordered' : 'bullet')
      if (list === 'ordered') {
        const siblings = Array.from(el.parentElement?.children || []).filter(s => (s.getAttribute('data-list') || 'ordered') === 'ordered')
        out += `${siblings.indexOf(el) + 1}. `
      } else {
        out += '- '
      }
    }
    for (const child of Array.from(el.childNodes)) await walk(child)
    if (isBlock) newline()
  }

  for (const child of Array.from(doc.body.childNodes)) await walk(child)

  return out
    .split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** True bila editor berisi teks atau gambar. */
export const aiEditorHasContent = (html: string) =>
  /<img\s/i.test(html) || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== ''
