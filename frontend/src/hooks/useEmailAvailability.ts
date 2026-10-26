import { useEffect, useState } from 'react'
import { pendaftarApi } from '../services/api'
import { getEmailError } from '../utils/emailValidation'

const DUPLICATE_MESSAGE = 'Email sudah terdaftar'

export function useEmailAvailability(email: string) {
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')

    if (getEmailError(email)) {
      return () => {
        cancelled = true
      }
    }

    const timer = setTimeout(async () => {
      try {
        const res = await pendaftarApi.cekEmail(email.trim())
        if (!cancelled && res.data?.exists) {
          setError(DUPLICATE_MESSAGE)
        }
      } catch {
        // Abaikan gangguan jaringan; validasi akhir tetap dilakukan saat submit.
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [email])

  return error
}
