export const QUESTION_AUDIO_ACCEPT = 'audio/*,video/mp4,.mp4,.m4a,.mp3,.wav,.ogg'

export function isQuestionAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true
  if (file.type === 'video/mp4') return true
  return /\.(mp4|m4a|m4b|mp3|wav|ogg|aac|flac)$/i.test(file.name)
}
