export function getYouTubeEmbedUrl(url: string): string | null {
  const videoMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (videoMatch) return `https://www.youtube.com/embed/${videoMatch[1]}`

  const listMatch = url.match(/(?:youtube\.com|youtu\.be)\/playlist\?(?:[^#]*&)?list=([a-zA-Z0-9_-]+)/)
  if (listMatch) return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`

  return null
}
