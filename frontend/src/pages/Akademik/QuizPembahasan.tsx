import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Eye, FileQuestion, Loader2, Volume2 } from 'lucide-react'
import { guruLmsApi, lmsApi } from '../../services/api'
import { useForceLightMode } from '../../hooks/useForceLightMode'

interface PembahasanOption {
  text?: string
  image_url?: string | null
}

interface PembahasanQuestion {
  id: number
  question: string
  section?: { id?: number; name?: string | null } | null
  question_type?: string
  rating_max?: number | null
  options?: PembahasanOption[] | null
  correct_index?: number | null
  keyword?: string | null
  points?: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
}

interface PembahasanPaket {
  title: string
  quiz_template?: string
  cover_url?: string | null
}

const cleanQuillHtml = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

const letter = (i: number) => String.fromCharCode(65 + i)

const fmtSectionName = (q: PembahasanQuestion) => (q.section?.name || '').trim()

interface QuizPembahasanProps {
  source: 'guru' | 'siswa' | 'admin'
}

export default function QuizPembahasan({ source }: QuizPembahasanProps) {
  useForceLightMode()
  const { lessonId, paketId, courseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paket, setPaket] = useState<PembahasanPaket | null>(null)
  const [questions, setQuestions] = useState<PembahasanQuestion[]>([])
  const [index, setIndex] = useState(0)

  const load = useCallback(() => {
    if (!lessonId || !paketId) return
    setLoading(true)
    setError(null)
    setIndex(0)
    const req = source === 'siswa'
      ? lmsApi.lessonPembahasan(Number(lessonId), Number(paketId))
      : guruLmsApi.lessonPaketQuestions(Number(lessonId), Number(paketId))
    req.then(res => {
      setPaket({
        title: res.data.paket?.title || 'Quiz',
        quiz_template: res.data.paket?.quiz_template,
        cover_url: res.data.paket?.cover_url || null,
      })
      setQuestions(res.data.questions || [])
    }).catch(() => {
      setError('Pembahasan tidak ditemukan atau paket bukan status pembahasan.')
    }).finally(() => setLoading(false))
  }, [lessonId, paketId, source])

  useEffect(() => {
    load()
  }, [load])

  const handleBack = () => {
    if (source === 'admin') {
      const base = location.pathname.startsWith('/admin-cabang') ? '/admin-cabang/lms' : '/lms'
      navigate(courseId ? `${base}/course/${courseId}/pertemuan/${lessonId}` : (lessonId ? `${base}/course/${courseId}` : `${base}`))
    } else if (source === 'guru') {
      navigate(lessonId ? `/guru-lms/lesson/${lessonId}` : '/guru-lms')
    } else if (courseId) {
      navigate(`/siswa-dashboard/lms/${courseId}/materi/${lessonId}`)
    } else {
      navigate(-1)
    }
  }

  const isJft = paket?.quiz_template === 'jft'
  const templateLabel = isJft ? 'JFT UI' : 'Basic'

  const t = useMemo(
    () =>
      isJft
        ? {
            header: 'bg-[#1f2022]',
            headSub: 'text-gray-400',
            sub: 'border-b border-[#4d7a4c] bg-[#5e8b5d]',
            bg: 'bg-[#edf1f5]',
            qblock: 'bg-[#e2f2fa]',
            navActive: 'bg-[#5e8b5d] text-white',
            navInactive: 'border border-gray-200 bg-[#eef2f7] text-gray-700',
            optionSel: 'border-emerald-500 bg-emerald-50',
            bubbleSel: 'bg-emerald-500 text-white',
            bubble: 'bg-[#eef2f7] text-gray-600',
            footer: 'bg-[#1f2022]',
            prev: 'bg-[#405640] hover:bg-[#4d664d]',
            next: 'bg-[#5e8b5d] hover:bg-[#4d7a4c]',
            accent: '#5e8b5d',
          }
        : {
            header: 'bg-[#0b2c45]',
            headSub: 'text-blue-200',
            sub: 'border-b border-[#0a5489] bg-[#0069b0]',
            bg: 'bg-[#eef4f9]',
            qblock: 'bg-[#e7f2fc]',
            navActive: 'bg-[#0069b0] text-white',
            navInactive: 'border border-gray-200 bg-[#eef4f9] text-gray-700',
            optionSel: 'border-emerald-500 bg-emerald-50',
            bubbleSel: 'bg-emerald-500 text-white',
            bubble: 'bg-[#eef4f9] text-gray-600',
            footer: 'bg-[#0b2c45]',
            prev: 'bg-[#0c4a73] hover:bg-[#0e5c8f]',
            next: 'bg-[#0069b0] hover:bg-[#00568f]',
            accent: '#0069b0',
          },
    [isJft]
  )

  const current = questions[index]
  const currentSection = current ? fmtSectionName(current) : ''
  const isLast = index === questions.length - 1

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Loader2 size={26} className="animate-spin" style={{ color: t.accent }} />
          <p className="text-xs font-semibold text-gray-500">Memuat pembahasan...</p>
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <FileQuestion size={30} className="text-gray-300" />
          <p className="text-sm font-bold text-gray-700">Pembahasan tidak tersedia</p>
          <p className="max-w-sm text-[11px] text-gray-400">{error}</p>
          <button onClick={handleBack}
            className="mt-2 flex items-center gap-1.5 rounded-md bg-[#0069b0] px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#004d7a]">
            <ArrowLeft size={13} /> Kembali ke Pertemuan
          </button>
        </div>
      )
    }
    if (questions.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <FileQuestion size={30} className="text-gray-300" />
          <p className="text-sm font-bold text-gray-700">Belum ada soal</p>
          <p className="text-[11px] text-gray-400">Paket ini belum memiliki soal untuk ditampilkan.</p>
          <button onClick={handleBack}
            className="mt-2 flex items-center gap-1.5 rounded-md bg-[#0069b0] px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#004d7a]">
            <ArrowLeft size={13} /> Kembali ke Pertemuan
          </button>
        </div>
      )
    }

    return (
      <>
        {/* ── Navigator soal ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2">
          <span className="mr-1 shrink-0 text-[10px] font-semibold text-gray-400">Soal:</span>
          {questions.map((qq, idx) => {
            const secName = fmtSectionName(qq)
            const showLabel = idx === 0 || fmtSectionName(questions[idx - 1]) !== secName
            return (
              <div key={qq.id} className="flex shrink-0 items-center gap-1.5">
                {showLabel && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-400">{secName || 'Umum'}</span>
                )}
                <button
                  onClick={() => setIndex(idx)}
                  className={`relative flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md px-1 text-xs font-bold transition-all hover:opacity-90 ${
                    idx === index ? t.navActive : t.navInactive
                  }`}
                >
                  {idx + 1}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Konten soal ── */}
        <div className={`flex-1 overflow-y-auto p-3 md:p-6 ${t.bg}`}>
          <div className="mx-auto w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 md:p-6">
              <div className="mb-4 flex flex-col items-center md:mb-5">
                <div className={`w-full rounded p-4 md:p-6 ${t.qblock}`}>
                  {current.image_url && (
                    <div className="mb-4 flex justify-center">
                      <img src={current.image_url} alt="Soal"
                        className="max-h-56 w-auto max-w-full rounded-lg border border-gray-200 bg-white object-contain" />
                    </div>
                  )}

                  <div
                    className="text-base font-medium text-gray-900 md:text-lg [&_img]:max-w-full [&_img]:mx-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_img]:my-2 [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: cleanQuillHtml(current.question) }} />

                  {current.audio_url && (
                    <div className="mt-4 rounded-lg border border-[#c9e2f0] bg-white p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Volume2 size={16} style={{ color: t.accent }} />
                        <p className="text-[11px] font-bold text-gray-700">
                          Putar soal audio{current.audio_max_plays != null ? ` · maks ${current.audio_max_plays}x` : ''}
                        </p>
                      </div>
                      <audio src={current.audio_url} controls className="h-9 w-full" />
                    </div>
                  )}

                  {current.points != null && current.points > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-gray-400">{current.points} poin</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 md:gap-3">
                {current.question_type === 'essay' ? (
                  current.keyword ? (
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Kunci Jawaban (essay)</p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-800">{current.keyword}</p>
                    </div>
                  ) : (
                    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                      <p className="text-xs font-medium text-gray-500">Soal essay — kunci jawaban ditentukan instruktur.</p>
                    </div>
                  )
                ) : (
                  <>
                    {current.question_type === 'rating' && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">
                        Skala penilaian 1–{current.rating_max || current.options?.length || 0} — kunci jawaban di bawah
                      </p>
                    )}
                    {(current.options || []).map((opt, oi) => {
                      const isCorrect = current.correct_index != null && oi === current.correct_index
                      const optLabel = typeof opt === 'string' ? opt : (opt?.text ?? '')
                      const optImg = typeof opt === 'string' ? null : (opt?.image_url || null)
                      const badgeLabel = current.question_type === 'rating' ? optLabel : letter(oi)
                      return (
                        <div
                          key={oi}
                          className={`flex w-full items-center gap-3 rounded border p-3 text-left md:gap-4 ${
                            isCorrect ? t.optionSel : 'border-gray-300 bg-white'
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isCorrect ? t.bubbleSel : t.bubble
                          }`}>
                            {badgeLabel}
                          </span>
                          {optImg && <img src={optImg} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover md:h-16 md:w-16" />}
                          {optLabel && <span className="text-sm text-gray-800 md:text-base">{optLabel}</span>}
                          {isCorrect && (
                            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              <Check size={11} /> Kunci Jawaban
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[10px] font-medium text-gray-400">
            Mode pembahasan — kunci jawaban ditandai hijau, tanpa penilaian & percobaan.
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* ── Chrome bar ── */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EF] bg-white px-3 py-2 md:px-4">
        <button onClick={handleBack}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-[#4B5063] transition-colors hover:bg-[#F4F5F8] hover:text-[#14182B]">
          <ArrowLeft size={14} /> Kembali
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[11px] font-black tracking-wide text-[#14182B]">Pembahasan Quiz</p>
          <p className="truncate text-[10px] font-medium text-[#8B90A0]">{(loading ? 'Memuat...' : paket?.title || 'Quiz')}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          isJft ? 'bg-[#5e8b5d]/10 text-[#4d7a4c]' : 'bg-[#0069b0]/10 text-[#0069b0]'
        }`}>
          <Eye size={11} /> {templateLabel}
        </span>
      </div>

      {/* ── Play header ── */}
      <div className={`relative ${t.header} px-4 py-2.5 md:px-6`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col leading-tight">
            <p className="text-[13px] text-white">
              <span className={`font-normal ${t.headSub}`}>Soal: </span>
              <span className="font-bold">{questions.length > 0 ? index + 1 : '—'}</span>
              <span className={`ml-2 font-normal ${t.headSub}`}>dari {questions.length}</span>
            </p>
            <p className={`mt-1 text-[13px] font-normal ${t.headSub}`}>Bagian:</p>
            <p className="max-w-[220px] truncate text-[13px] font-semibold text-white">{currentSection || '—'}</p>
          </div>
          <span className="shrink-0 rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
            Pembahasan
          </span>
        </div>
      </div>

      {/* ── Subheader ── */}
      <div className={`flex items-center justify-between ${t.sub} px-4 py-2 md:px-6`}>
        <p className="min-w-0 truncate text-[13px] text-white">
          <span className="font-bold">Tes: </span>
          <span className="font-normal">{paket?.title || 'Quiz'}</span>
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-white/80">{questions.length} soal</span>
      </div>

      {renderBody()}

      {/* ── Footer navigasi ── */}
      {!loading && !error && questions.length > 0 && (
        <div className={`flex items-center justify-between gap-2 ${t.footer} px-3 py-2 md:px-6`}>
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            className={`rounded px-4 py-2 text-sm font-semibold text-white transition-colors ${t.prev} disabled:opacity-50 md:px-5`}
          >
            &lt; Kembali
          </button>
          {isLast ? (
            <button
              onClick={handleBack}
              className={`flex items-center gap-1.5 rounded px-5 py-2 text-sm font-semibold text-white transition-colors ${t.next}`}
            >
              <Eye size={14} /> Selesai Pembahasan
            </button>
          ) : (
            <button
              onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))}
              className={`rounded px-5 py-2 text-sm font-semibold text-white transition-colors ${t.next} md:px-5`}
            >
              Selanjutnya &gt;
            </button>
          )}
        </div>
      )}
    </div>
  )
}