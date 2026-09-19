import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

type EchoLike = {
  channel: (name: string) => {
    listen: (event: string, cb: (data: unknown) => void) => unknown
  }
  leaveChannel: (name: string) => void
}

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'mendunia-local-key'
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'localhost'
const REVERB_PORT = Number(import.meta.env.VITE_REVERB_PORT || 8080)
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'http'

let echo: EchoLike | null = null

export function getEcho(): EchoLike | null {
  if (echo) return echo
  // @ts-expect-error lucide-style global window.Pusher needed by laravel-echo
  window.Pusher = Pusher
  try {
    echo = new Echo({
      broadcaster: 'pusher',
      key: REVERB_KEY,
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8443),
      forceTLS: REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
    })
  } catch {
    echo = null
  }
  return echo
}

export function leaveChannel(name: string) {
  try {
    getEcho()?.leaveChannel(name)
  } catch {
    /* abaikan */
  }
}