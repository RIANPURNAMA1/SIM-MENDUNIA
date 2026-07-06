import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '../services/api'

export interface UserData {
  id: number
  name: string
  email: string
  role: string
  nip: string | null
  nik: string | null
  foto_profil: string | null
  jabatan: string | null
  status: string
}

interface AuthContextType {
  user: UserData | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const res = await authApi.user()
      setUser(res.data)
    } catch {
      setUser(null)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('token', res.data.token)
    await fetchUser()
    return res
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // tetap lanjutkan hapus state meski gagal
    }
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
