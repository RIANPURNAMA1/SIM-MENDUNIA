import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
}

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    if (isIOS()) {
      setIosHint(true)
      setVisible(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    setDeferred(null)
  }

  if (!visible) return null

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#0E6187]/15 bg-white p-4 shadow-sm animate-fade-up">
      <button
        onClick={dismiss}
        aria-label="Tutup"
        className="absolute right-3 top-3 text-slate-300 transition-colors hover:text-slate-500"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#0E6187]/10 text-[#0E6187]">
          {iosHint ? <Share size={18} /> : <Download size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">Pasang aplikasi Mendunia</p>
          {iosHint ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Ketuk ikon <span className="font-semibold text-slate-700">Bagikan</span> di bawah, lalu pilih
              <span className="font-semibold text-slate-700"> "Tambah ke Layar Utama"</span> agar bisa dibuka seperti aplikasi.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Tambahkan ke layar utama HP agar absen lebih cepat, seperti aplikasi.
            </p>
          )}
          {!iosHint && (
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0E6187] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#0c5474] active:scale-95"
            >
              <Download size={14} /> Pasang Sekarang
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
