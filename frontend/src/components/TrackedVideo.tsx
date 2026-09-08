import { useCallback, useEffect, useRef } from 'react'

const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] || null
}

const getYouTubeEmbed = (url: string) => {
  const videoId = getYouTubeId(url)
  const params = 'enablejsapi=1&rel=0'
  if (videoId) return `https://www.youtube.com/embed/${videoId}?${params}`
  const listMatch = url.match(/(?:youtube\.com|youtu\.be)\/playlist\?(?:[^#]*&)?list=([a-zA-Z0-9_-]+)/)
  if (listMatch) return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&${params}`
  return null
}

function loadYtApi(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const w = window as any
    if (w.YT && w.YT.Player) return resolve()
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script')
      s.id = 'yt-iframe-api'
      s.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(s)
    }
    const t = setTimeout(() => {
      if (w.YT && w.YT.Player) resolve()
      else reject(new Error('Gagal memuat pemutar video'))
    }, 15000)
    void t
  })
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
  const playerRef = useRef<any>(null)
  const lastSentRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const sentEndedRef = useRef(false)
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

  const pollYouTube = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    let time: number
    let duration: number
    try {
      time = player.getCurrentTime ? player.getCurrentTime() : 0
      duration = player.getDuration ? player.getDuration() : 0
    } catch {
      return
    }
    if (duration > 0) heartbeat(time, duration)
  }, [heartbeat])

  useEffect(() => {
    sentEndedRef.current = false
    lastSentRef.current = 0
    let playerCreated = false

    if (isYouTube) {
      loadYtApi().then(() => {
        const w = window as any
        if (!w.YT || !w.YT.Player || playerCreated) return
        playerCreated = true
        const embed = embedRef.current
        if (!embed) return
        const urlMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        playerRef.current = new w.YT.Player(embed, {
          videoId: urlMatch?.[1] || null,
          events: {
            onReady: () => { frameRef.current = window.setInterval(pollYouTube, 1000) },
            onStateChange: (event: any) => {
              if (event.data === w.YT.PlayerState.ENDED) {
                sentEndedRef.current = true
                onHeartbeatRef.current(1, 1)
              }
              if (event.data === w.YT.PlayerState.PLAYING && frameRef.current === null) {
                frameRef.current = window.setInterval(pollYouTube, 1000)
              }
            },
          },
        })
      }).catch(() => {})
    } else {
      const v = videoRef.current
      const handleTime = () => {
        if (v) heartbeat(v.currentTime, v.duration || 0)
      }
      v?.addEventListener('timeupdate', handleTime)
      return () => {
        v?.removeEventListener('timeupdate', handleTime)
        if (frameRef.current !== null) {
          window.clearInterval(frameRef.current)
          frameRef.current = null
        }
        if (playerRef.current?.destroy) {
          try { playerRef.current.destroy() } catch { /* ignore */ }
        }
        playerRef.current = null
      }
    }

    return () => {
      if (frameRef.current !== null) {
        window.clearInterval(frameRef.current)
        frameRef.current = null
      }
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy() } catch { /* ignore */ }
      }
      playerRef.current = null
    }
  }, [url, isYouTube, pollYouTube])

  if (isYouTube) {
    return <iframe ref={embedRef} src={embedSrc!} className="w-full aspect-video" allowFullScreen title={title} />
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