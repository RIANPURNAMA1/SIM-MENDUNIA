const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmailcom': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.con': 'icloud.com',
  'protonmial.com': 'protonmail.com',
  'protonmail.co': 'protonmail.com',
}

export function getEmailError(value: string): string {
  const email = value.trim().toLowerCase()
  if (!email) return 'Alamat email wajib diisi'
  if (!EMAIL_RE.test(email)) return 'Format email tidak valid'

  const domain = email.split('@')[1] ?? ''
  const suggestion = DOMAIN_TYPOS[domain]
  if (suggestion) {
    return `Domain email sepertinya typo. Mungkin maksud Anda @${suggestion}`
  }

  return ''
}
