import { useCallback, useEffect, useRef } from 'react'

const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] || null
}

const getYouTubeEmbed = (url: string) => {
  const videoId = getYouTubeId(url)
  // disablekb=1 menonaktifkan shortcut keyboard; kontrol pemutar dibiarkan normal supaya
  // tetap bisa diklik/diputar/dijeda seperti awal.
  const params = 'enablejsapi=1&rel=0&disablekb=1&playsinline=1'
  if (videoId) return `https://www.youtube.com/embed/${videoId}?${params}`
  const listMatch = url.match(/(?:youtube\.com|youtu\.be)\/playlist\?(?:[^#]*&)?list=([a-zA-Z0-9_-]+)/)
  if (listMatch) return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&${params}`
  return null
}

interface TrackedVideoProps {
  url: string
  title: string
  progress: unknown
  onHeartbeat: (currentTime: number, duration: number) => void
}

export default function TrackedVideo({ url, title, progress: _progress, onHeartbeat }: TrackedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const embedRef = useRef<HTMLIFrameElement | null>(null)
  const lastSentRef = useRef(0)
  const sentEndedRef = useRef(false)
  const baselineTimeRef = useRef(-1)
  const baselineWallRef = useRef(0)
  const onHeartbeatRef = useRef(onHeartbeat)
  onHeartbeatRef.current = onHeartbeat

  const embedSrc = getYouTubeEmbed(url)
  const isYouTube = !!embedSrc

  const heartbeat = useCallback((currentTime: number, duration: number) => {
    if (duration > 0 && currentTime > duration - 2 && !sentEndedRef.current) {
      sentEndedRef.current = true
      onHeartbeatRef.current(duration, duration)
      return
    }
    const now = Date.now()
    if (now - lastSentRef.current < 5000) return
    lastSentRef.current = now
    if (duration > 0 && currentTime <= duration) {
      onHeartbeatRef.current(currentTime, duration)
    }
  }, [])

  useEffect(() => {
    if (!isYouTube) return
    const frame = embedRef.current
    if (!frame || !frame.contentWindow) return
    lastSentRef.current = 0
    sentEndedRef.current = false
    baselineTimeRef.current = -1
    baselineWallRef.current = 0
    const uid = `sim-${Math.random().toString(36).slice(2)}`

    const post = (obj: unknown) => {
      try {
        frame.contentWindow?.postMessage(JSON.stringify(obj), '*')
      } catch { /* ignore */ }
    }

    // Koreksi anti-loncat & anti-percepat tanpa memblokir klik:
    // biasa dipakai jalur pesan langsung YouTube (tidak butuh skrip API).
    const enforce = (info: any) => {
      const t = info.currentTime
      const d = info.duration
      const rate = info.playbackRate
      const st = info.playerState

      if (typeof rate === 'number' && Math.abs(rate - 1) > 0.001) {
        post({ event: 'command', func: 'setPlaybackRate', args: [1] })
      }

      if (typeof t === 'number' && typeof d === 'number' && st === 1) {
        const now = Date.now()
        if (baselineTimeRef.current >= 0 && d > 0 && t < d - 2) {
          const elapsed = (now - baselineWallRef.current) / 1000
          if (t - baselineTimeRef.current > elapsed + 2.5) {
            post({ event: 'command', func: 'seekTo', args: [baselineTimeRef.current + elapsed, true] })
            return
          }
        }
        baselineTimeRef.current = t
        baselineWallRef.current = now
        heartbeat(t, d)
      }

      if (st === 0 && !sentEndedRef.current) {
        sentEndedRef.current = true
        onHeartbeatRef.current(1, 1)
      }
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin && e.origin !== 'https://www.youtube.com') return
      let parsed: any
      try {
        parsed = JSON.parse(e.data)
      } catch {
        return
      }
      if (parsed?.event !== 'onInfoDelivery') return
      enforce(parsed.info || {})
    }
    window.addEventListener('message', onMessage)

    const poll = window.setInterval(() => post({ event: 'listening', id: uid }), 1000)
    post({ event: 'listening', id: uid })

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(poll)
    }
  }, [url, isYouTube, heartbeat])

  if (isYouTube) {
    return (
      <iframe
        ref={embedRef}
        src={embedSrc!}
        className="w-full aspect-video"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        title={title}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className="w-full aspect-video"
      controls
      src={url}
      title={title}
      onPlay={(e) => {
        const v = e.currentTarget
        if (v.duration) heartbeat(v.currentTime, v.duration)
      }}
      onEnded={(e) => {
        const v = e.currentTarget
        sentEndedRef.current = true
        onHeartbeat(v.duration || v.currentTime, v.duration || v.currentTime)
      }}
      onLoadedMetadata={(e) => e.currentTarget.duration && onHeartbeat(0, e.currentTarget.duration)}
    />
  )
}