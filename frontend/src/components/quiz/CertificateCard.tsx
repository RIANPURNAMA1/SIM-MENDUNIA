import { useEffect, useRef, useState } from 'react'
import { Printer, ShieldCheck } from 'lucide-react'

export type RincianBagian = {
  id: number
  name: string
  total: number
  correct: number
  percent: number
}

export type Sertifikat = {
  id?: number
  nomor: string
  kode_verifikasi: string
  judul: string
  judul_paket?: string
  kategori?: string | null
  penerbit: string
  kandidat_nama: string
  kandidat_nik?: string | null
  kandidat_no_registrasi?: string | null
  /** Data tambahan untuk tabel identitas (opsional). */
  kandidat_kewarganegaraan?: string | null
  kandidat_tanggal_lahir?: string | null
  kandidat_jenis_kelamin?: string | null
  lokasi_ujian?: string | null
  tanggal_ujian?: string | null
  batch_nama?: string | null
  level?: string | null
  nilai: number
  nilai_lulus: number
  /** Rentang skor untuk bar total skor. JFT asli: 10–250. Bawaan: 0–100. */
  skor_min?: number
  skor_maks?: number
  lulus: boolean
  benar: number
  total_soal: number
  durasi_menit?: number
  rincian_bagian: RincianBagian[]
  foto_url?: string | null
  tanggal_indah: string
  expired: boolean
  expired_at?: string | null
}

type Props = {
  sertifikat: Sertifikat
  /** Label tombol unduh/cetak. */
  actionLabel?: string
  className?: string
}

const LEBAR = 794 // A4 portrait @ 96dpi
const TINGGI = 1123
const GRADIEN = 'linear-gradient(to right, #e5412d 0%, #f28c28 30%, #f2c230 55%, #9ccc3c 78%, #35a853 100%)'
const FONT_JP = `'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif`

/** Label Jepang untuk bagian ujian JFT-Basic (dicocokkan dari nama bagian). */
const LABEL_JP: Array<[RegExp, string]> = [
  [/script|vocab|moji|goi/i, '文字と語彙'],
  [/conversation|expression|kaiwa/i, '会話と表現'],
  [/listening|choukai|chōkai/i, '聴解'],
  [/reading|dokkai/i, '読解'],
]

function labelJepang(nama: string): string | null {
  return LABEL_JP.find(([re]) => re.test(nama))?.[1] ?? null
}

function formatTanggal(iso?: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const klem = (n: number) => Math.max(0, Math.min(100, n))

function Baris({ jp, en, children }: { jp: string; en: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start" style={{ minHeight: 36 }}>
      <div style={{ width: 170 }}>
        <p className="text-[14px] font-bold leading-tight text-slate-900" style={{ fontFamily: FONT_JP }}>
          {jp}
        </p>
        <p className="text-[9px] leading-tight text-slate-500">{en}</p>
      </div>
      <p className="flex-1 pt-0.5 text-[13px] text-slate-800">: {children}</p>
    </div>
  )
}

/** Bar total skor: gradien merah→hijau, tanda batas lulus, dan penanda skor. */
function BarTotalSkor({ nilai, batas, min, maks }: { nilai: number; batas: number; min: number; maks: number }) {
  const posisi = (v: number) => klem(((v - min) / (maks - min || 1)) * 100)
  return (
    <div className="px-1">
      <div className="mb-1 flex justify-between text-[9px] text-slate-500">
        <span>Total Score</span>
        <span>
          <span style={{ fontFamily: FONT_JP }}>（得点範囲</span> : {min} - {maks} points
          <span style={{ fontFamily: FONT_JP }}>）</span>
        </span>
        <span>
          <span style={{ fontFamily: FONT_JP }}>判定基準点</span> : {batas} points
        </span>
      </div>
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-[10px] h-[5px] rounded-full" style={{ background: GRADIEN }} />
        {[0, posisi(batas), 100].map((p, i) => (
          <div key={i} className="absolute top-[4px] h-[17px] w-[2px] bg-slate-900" style={{ left: `calc(${p}% - 1px)` }} />
        ))}
        <div
          className="absolute top-[5px] h-[15px] w-[15px] rounded-full border-[3px] border-white bg-emerald-600 shadow ring-1 ring-emerald-700"
          style={{ left: `calc(${posisi(nilai)}% - 7px)` }}
        />
        <span
          className="absolute -top-[2px] text-[9px] font-semibold text-slate-700"
          style={{ left: `calc(${posisi(nilai)}% - 8px)` }}
        >
          {nilai}
        </span>
      </div>
      <div className="relative h-3 text-[9px] text-slate-500">
        <span className="absolute left-0">{min}</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${posisi(batas)}%` }}>
          {batas}
        </span>
        <span className="absolute right-0">{maks}</span>
      </div>
    </div>
  )
}

/** Bar persentase jawaban benar per bagian, dengan penanda bulat. */
function BarBagian({ baris }: { baris: RincianBagian }) {
  const persen = klem(Number(baris.percent) || 0)
  const jp = labelJepang(baris.name)
  return (
    <div className="flex items-center gap-4">
      <div style={{ width: 210 }}>
        {jp && (
          <p className="text-[13px] font-bold leading-tight text-slate-900" style={{ fontFamily: FONT_JP }}>
            {jp}
          </p>
        )}
        <p className={jp ? 'text-[10px] leading-tight text-slate-600' : 'text-[12px] font-semibold text-slate-800'}>
          {baris.name}
        </p>
      </div>
      <div className="relative flex-1" style={{ height: 22 }}>
        <div className="absolute left-0 right-0 top-[11px] h-[5px] rounded-full" style={{ background: GRADIEN }} />
        <div
          className="absolute top-[6px] h-[15px] w-[15px] rounded-full border-[3px] border-white bg-emerald-600 shadow ring-1 ring-emerald-700"
          style={{ left: `calc(${persen}% - 7px)` }}
        />
        <span
          className="absolute top-[-2px] text-[9px] font-semibold text-slate-600"
          style={{ left: `calc(${persen}% - 10px)` }}
        >
          {persen}%
        </span>
      </div>
    </div>
  )
}

export default function CertificateCard({ sertifikat: s, actionLabel = 'Cetak / Simpan PDF', className = '' }: Props) {
  const [zoom, setZoom] = useState(1)
  const [tinggiKartu, setTinggiKartu] = useState(TINGGI)
  const wrapRef = useRef<HTMLDivElement>(null)
  const kartuRef = useRef<HTMLDivElement>(null)

  // Zoom menyesuaikan lebar kontainer agar sertifikat tidak terpotong, dan
  // tinggi pembungkus mengikuti tinggi asli kartu. Isi sertifikat bisa lebih
  // dari satu halaman A4 (banyak bagian, nama panjang), jadi tinggi kartu
  // diukur, bukan dipatok 1123px — kalau dipatok, isi di bawahnya terpotong.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const hitung = () => {
      setZoom(Math.min(1, el.clientWidth / LEBAR))
      const tinggi = kartuRef.current?.offsetHeight
      if (tinggi) setTinggiKartu(tinggi)
    }

    hitung()

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(hitung) : null
    if (ro) {
      ro.observe(el)
      if (kartuRef.current) ro.observe(kartuRef.current)
      return () => ro.disconnect()
    }

    window.addEventListener('resize', hitung)
    return () => window.removeEventListener('resize', hitung)
  }, [])

  const min = s.skor_min ?? 0
  const maks = s.skor_maks ?? 100
  const namaUjian = s.judul_paket || s.judul

  return (
    <div className={`sertifikat-akar ${className}`}>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm text-slate-600">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="min-w-0 truncate">
            Nomor <span className="font-mono font-semibold text-slate-800">{s.nomor}</span> · Kode{' '}
            <span className="font-mono font-semibold text-slate-800">{s.kode_verifikasi}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>

      <div
        ref={wrapRef}
        className="print-content sertifikat-print overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-slate-200"
        style={{ height: tinggiKartu * zoom }}
      >
        <div
          ref={kartuRef}
          className="sertifikat-kartu origin-top-left bg-white text-slate-900"
          style={{ width: LEBAR, minHeight: TINGGI, transform: `scale(${zoom})`, fontFamily: `Arial, ${FONT_JP}` }}
        >
          <div className="sertifikat-isi flex flex-col px-12 py-9">
            {/* Kop */}
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1 text-center" style={{ paddingLeft: 90 }}>
                <h3 className="text-[24px] font-bold leading-tight" style={{ fontFamily: FONT_JP }}>
                  日本語基礎テスト 判定結果通知書
                </h3>
                <p className="mt-1 text-[12px] text-slate-700">{namaUjian} · Notification of assessment results</p>
              </div>
              <div className="w-[90px] text-right">
                <p className="text-[12px] font-bold leading-tight text-slate-800">{s.penerbit}</p>
              </div>
            </div>
            <div className="mt-3 h-px bg-slate-300" />

            {/* Identitas */}
            <div className="mt-5 flex gap-5">
              {s.foto_url ? (
                <img
                  src={s.foto_url}
                  alt={`Foto ${s.kandidat_nama}`}
                  className="object-cover ring-1 ring-slate-300"
                  style={{ width: 110, height: 140 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 ring-1 ring-slate-200"
                  style={{ width: 110, height: 140 }}
                >
                  Tanpa foto
                </div>
              )}
              <div className="flex-1">
                <Baris jp="受験番号" en="Registration Number">
                  {s.kandidat_no_registrasi || s.kandidat_nik || '-'}
                </Baris>
                <Baris jp="氏名" en="Name">
                  <span className="font-semibold uppercase">{s.kandidat_nama}</span>
                </Baris>
                <Baris jp="国籍" en="Nationality">
                  {s.kandidat_kewarganegaraan || 'Indonesia'}
                </Baris>
                <Baris jp="生年月日" en="Date of Birth">
                  {formatTanggal(s.kandidat_tanggal_lahir)}
                </Baris>
                <Baris jp="性別" en="Sex">
                  {s.kandidat_jenis_kelamin || '-'}
                </Baris>
                <Baris jp="受験地" en="Test Location">
                  {s.lokasi_ujian || '-'}
                </Baris>
                <Baris jp="受験日" en="Test Date">
                  {s.tanggal_ujian ? formatTanggal(s.tanggal_ujian) : s.tanggal_indah}
                </Baris>
              </div>
            </div>

            {/* Pengantar */}
            <div className="mt-5 text-[12px] leading-snug">
              <p style={{ fontFamily: FONT_JP }}>試験の結果をお知らせします。</p>
              <p className="text-slate-700">Your test results are as follows.</p>
            </div>

            {/* Kotak hasil */}
            <div className="mt-3 rounded-sm border border-slate-300 px-5 py-4">
              <p className="text-[19px] font-bold" style={{ fontFamily: FONT_JP }}>
                総合得点 : {s.nilai} 点
              </p>
              <BarTotalSkor nilai={s.nilai} batas={s.nilai_lulus} min={min} maks={maks} />

              <div className="mt-4 text-[12px] leading-snug">
                {s.lulus ? (
                  <>
                    <p style={{ fontFamily: FONT_JP }}>
                      あなたは国際交流基金日本語基礎テストにおいて、ある程度日常会話ができ、生活に支障がない程度の日本語能力水準に達していると判定されました。
                    </p>
                    <p className="mt-1 text-[10px] italic text-slate-600">
                      You were assessed to have reached a level of Japanese language proficiency to be able to engage in
                      everyday conversation to a certain extent and without difficulties in daily life.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontFamily: FONT_JP }}>
                      今回の試験では、判定基準点（{s.nilai_lulus}点）に達していません。
                    </p>
                    <p className="mt-1 text-[10px] italic text-slate-600">
                      You did not reach the passing score ({s.nilai_lulus} points) on this test.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4">
                <p className="text-[12px] font-bold" style={{ fontFamily: FONT_JP }}>
                  セクション毎の正答率は次のとおりです。
                </p>
                <p className="mb-2 text-[10px] text-slate-600">
                  The percentage of correct answers for each section are as follows.
                </p>
                <div className="space-y-2">
                  {s.rincian_bagian.map((b) => (
                    <BarBagian key={b.id} baris={b} />
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[10px] text-slate-500">
                Benar {s.benar}/{s.total_soal} soal
                {typeof s.durasi_menit === 'number' && <> · Durasi {s.durasi_menit} menit</>}
                {s.level && <> · Level {s.level}</>}
              </p>
            </div>

            <div className="flex-1" />

            {/* Kaki: keaslian */}
            <div className="flex items-end justify-between gap-6 border-t border-slate-300 pt-3 text-[10px] text-slate-600">
              <div className="space-y-0.5">
                <p>Diterbitkan: {s.tanggal_indah}</p>
                {s.batch_nama && <p>Batch: {s.batch_nama}</p>}
                {s.expired_at && <p>Berlaku hingga {formatTanggal(s.expired_at)}</p>}
              </div>
              <div className="text-right">
                <p>
                  No. <span className="font-mono font-semibold text-slate-800">{s.nomor}</span>
                </p>
                <p>
                  Kode verifikasi <span className="font-mono font-semibold text-slate-800">{s.kode_verifikasi}</span>
                </p>
                <p className="mt-0.5">Cek keaslian di halaman verifikasi sertifikat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {s.expired && (
        <p className="no-print mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Sertifikat ini sudah melewati masa berlaku.
        </p>
      )}

      <p className="no-print mt-3 text-xs text-slate-500">
        Simpan sebagai PDF: klik tombol cetak, lalu pilih “Save as PDF” pada dialog pencetakan.
      </p>

      <style>{`
        /* A4 portrait tanpa margin: kartu memakai lebar halaman penuh. */
        @page { size: A4 portrait; margin: 0; }
        @media print {
          /* Rules global .print-content di index.css memakai position:fixed +
             translate(-50%,-50%) untuk elemen hasil cetak lain (mis. struk
             Cabang). Aturan itu ikut kena ke sertifikat ini karena kelasnya
             sama, sehingga kartunya terangkat keluar area cetak dan terpotong.
             Semua override di bawah memakai !important supaya menang dari
             stylesheet global. */
          .print-content.sertifikat-print {
            /* position:fixed dipakai supaya kartu keluar dari alur dokumen:
               elemen lain tetap visibility:hidden tapi masih memakan tinggi,
               jadi kalau ikut flow sertifikat terdorong ke halaman kedua.
               fixed tanpa centering menaruh kartu tepat di asal halaman. */
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            outline: 0 !important;
          }
          /* Tombol cetak, nomor, dan catatan tidak ikut ke PDF. */
          .sertifikat-akar .no-print { display: none !important; }
          .sertifikat-kartu {
            width: 100% !important;
            min-height: 100% !important;
            height: auto !important;
            transform: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Cegah isi kotak hasil terbelah awkward di tengah antar halaman. */
          .sertifikat-kartu .sertifikat-isi * {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}