'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi, getAuthToken, setAuthToken, User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // โหลดข้อมูลผู้ใช้จาก token เมื่อ mount
  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          const userData = await authApi.getProfile(token)
          setUser(userData)
        } catch (error) {
          // Token ไม่ valid ให้ลบออก
          setAuthToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    loadUser()

    // ฟัง event เมื่อ token ถูก clear (เช่น เมื่อได้ 401)
    const handleLogout = () => {
      setAuthToken(null)
      setUser(null)
      if (pathname !== '/login') {
        router.push('/login')
      }
    }

    window.addEventListener('auth:logout', handleLogout)

    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [router, pathname])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setAuthToken(response.access_token)
    setUser(response.user)
    router.push('/')
  }

  const register = async (data: { name: string; email: string; password: string; role?: string }) => {
    const response = await authApi.register(data)
    setAuthToken(response.access_token)
    setUser(response.user)
    router.push('/')
  }

  const logout = () => {
    setAuthToken(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

