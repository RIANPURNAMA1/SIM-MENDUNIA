export type ResultMood = 'perfect' | 'great' | 'pass' | 'low' | 'fail'

export type ResultSound = 'fanfare' | 'chord' | 'soft' | 'sad'

export interface ResultData {
  score: number | null
  passing_score: number
  correct_count: number | null
  total_count: number | null
}

interface MoodPreset {
  title: string
  subtitle: string
  note: string
  ring: string
  glow: string
  ink: string
  badge: string
  icon: string
  sound: ResultSound
}

export interface CelebrationTheme {
  name: string
  perfect: { ring: string; glow: string; ink: string }
  great: { ring: string; glow: string; ink: string }
  pass: { ring: string; glow: string; ink: string }
  low: { ring: string; glow: string; ink: string }
  fail: { ring: string; glow: string; ink: string }
}

export const BASIC_THEME: CelebrationTheme = {
  name: 'Basic',
  perfect: { ring: '#f59e0b', glow: 'rgba(245,158,11,.45)', ink: '#b45309' },
  great: { ring: '#10b981', glow: 'rgba(16,185,129,.35)', ink: '#0f766e' },
  pass: { ring: '#0069b0', glow: 'rgba(0,105,176,.3)', ink: '#0b2c45' },
  low: { ring: '#f97316', glow: 'rgba(249,115,22,.32)', ink: '#9a3412' },
  fail: { ring: '#ef4444', glow: 'rgba(239,68,68,.32)', ink: '#b91c1c' },
}

export const JFT_THEME: CelebrationTheme = {
  name: 'JFT UI',
  perfect: { ring: '#a855f7', glow: 'rgba(168,85,247,.45)', ink: '#7e22ce' },
  great: { ring: '#06b6d4', glow: 'rgba(6,182,212,.36)', ink: '#0e7490' },
  pass: { ring: '#4f46e5', glow: 'rgba(79,70,229,.32)', ink: '#3730a3' },
  low: { ring: '#f59e0b', glow: 'rgba(245,158,11,.32)', ink: '#b45309' },
  fail: { ring: '#e11d48', glow: 'rgba(225,29,72,.32)', ink: '#9f1239' },
}

const MOODS: Record<ResultMood, Omit<MoodPreset, 'ring' | 'glow' | 'ink'>> = {
  perfect: {
    title: 'Nilai Sempurna!',
    subtitle: 'Tidak ada yang perlu diperbaiki. Kamu benar-benar menguasai materi ini.',
    note: 'Nilai 100%. Lihat pembahasan untuk memastikan tidak ada materi yang terlewat.',
    badge: 'Sempurna',
    icon: '🏆',
    sound: 'fanfare',
  },
  great: {
    title: 'Hebat! Kamu Menguasai Materi!',
    subtitle: 'Hasilmu jauh di atas batas minimal. Pertahankan semangat belajarmu.',
    note: 'Lihat pembahasan agar makin paham setiap materinya.',
    badge: 'Sangat Baik',
    icon: '🎯',
    sound: 'fanfare',
  },
  pass: {
    title: 'Lulus! Kamu Hebat!',
    subtitle: 'Nilai kamu sudah melewati batas minimal. Kerja kerasmu terlihat.',
    note: 'Lihat pembahasan dan tingkatkan lagi di materi yang masih kurang dikuasai.',
    badge: 'Tuntas',
    icon: '🎉',
    sound: 'chord',
  },
  low: {
    title: 'Hampir! Ayo Berayo!',
    subtitle: 'Nilaimu belum mencapai batas minimal, tapi kamu sudah memulai dengan baik.',
    note: 'Pelajari lagi pembahasannya, lalu coba kembali di kesempatan berikutnya.',
    badge: 'Belum Tuntas',
    icon: '🔥',
    sound: 'soft',
  },
  fail: {
    title: 'Belum Tuntas, Tetap Semangat!',
    subtitle: 'Nilaimu masih jauh dari batas minimal. Jangan menyerah, ini awal belajar.',
    note: 'Baca pembahasan sampai paham, lalu ulangi latihan sampai nilaimu membaik.',
    badge: 'Perlu Beningkatan',
    icon: '💪',
    sound: 'sad',
  },
}

export const getResultMood = (score: number, passing: number): ResultMood => {
  if (score >= 100) return 'perfect'
  if (score >= Math.max(passing, Math.min(90, passing + 15))) return 'great'
  if (score >= passing) return 'pass'
  if (score >= Math.max(0, passing - 10)) return 'low'
  return 'fail'
}

export const getMoodPreset = (mood: ResultMood, theme: CelebrationTheme) => ({
  ...MOODS[mood],
  ...theme[mood],
})

export const buildCelebrationHTML = (
  data: ResultData,
  theme: CelebrationTheme = BASIC_THEME,
) => {
  const score = Math.round(Number(data.score ?? 0))
  const passing = Number(data.passing_score ?? 0)
  const mood = getResultMood(score, passing)
  const conf = getMoodPreset(mood, theme)
  const correct = data.correct_count
  const total = data.total_count
  const summary = correct !== null && total
    ? `${correct} dari ${total} soal tepat · KKM ${passing}`
    : `KKM ${passing}`

  return `
    <div style="text-align:center">
      <div style="position:relative;display:inline-block;width:132px;height:132px;margin:0 auto 14px">
        <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 55%, ${conf.glow} 0%, rgba(255,255,255,0) 70%)"></div>
        <div style="position:absolute;inset:10px;border-radius:50%;background:#fff;border:4px solid ${conf.ring};box-shadow:0 8px 22px ${conf.glow}"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">
          <span style="font-size:34px;line-height:1">${conf.icon}</span>
          <span style="font-size:27px;font-weight:800;color:${conf.ink};letter-spacing:-.5px">${score}</span>
          <span style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:.6px">DARI 100</span>
        </div>
      </div>
      <span style="display:inline-block;padding:4px 12px;margin:0 0 10px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.5px;color:${conf.ink};background:${conf.ring}1f;border:1px solid ${conf.ring}55">${conf.badge}</span>
      <p style="font-size:21px;font-weight:800;color:#1a1a2e;margin:0 0 6px;line-height:1.25">${conf.title}</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px;line-height:1.5">${conf.subtitle}</p>
      <p style="font-size:12px;color:${conf.ink};font-weight:700;margin:0 0 4px">${summary}</p>
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5">${conf.note}</p>
    </div>
  `
}

const SOUND_MAP: Record<ResultSound, { f: number; at: number; d: number; type: OscillatorType }[]> = {
  fanfare: [
    { f: 523.25, at: 0, d: 0.16, type: 'triangle' },
    { f: 659.25, at: 0.13, d: 0.16, type: 'triangle' },
    { f: 783.99, at: 0.26, d: 0.16, type: 'triangle' },
    { f: 1046.5, at: 0.39, d: 0.42, type: 'triangle' },
    { f: 1318.5, at: 0.56, d: 0.55, type: 'sine' },
  ],
  chord: [
    { f: 523.25, at: 0, d: 0.16, type: 'sine' },
    { f: 659.25, at: 0.11, d: 0.16, type: 'sine' },
    { f: 783.99, at: 0.22, d: 0.44, type: 'sine' },
  ],
  soft: [
    { f: 440, at: 0, d: 0.26, type: 'sine' },
    { f: 392, at: 0.22, d: 0.34, type: 'sine' },
  ],
  sad: [
    { f: 392, at: 0, d: 0.26, type: 'sine' },
    { f: 329.63, at: 0.22, d: 0.34, type: 'sine' },
  ],
}

export const playResultSound = (sound: ResultSound) => {
  try {
    const ctx = new AudioContext()
    SOUND_MAP[sound].forEach(n => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = n.type
      osc.frequency.value = n.f
      gain.gain.setValueAtTime(0, ctx.currentTime + n.at)
      gain.gain.linearRampToValueAtTime(0.26, ctx.currentTime + n.at + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.at + n.d)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + n.at)
      osc.stop(ctx.currentTime + n.at + n.d + 0.05)
    })
  } catch {}
}

export const celebrateResult = (popup: HTMLElement) => {
  const badge = popup.querySelector('div[style*="width:132px"]')
  if (badge) {
    badge.animate(
      [
        { transform: 'scale(0.4) rotate(-18deg)', opacity: 0 },
        { transform: 'scale(1.12) rotate(5deg)', opacity: 1 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ],
      { duration: 650, easing: 'cubic-bezier(.34,1.56,.64,1)' }
    )
  }
}
