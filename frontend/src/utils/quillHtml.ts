export const cleanQuillHtml = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')