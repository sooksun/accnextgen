const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8892'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการล็อกอิน')
    }

    return response.json()
  },

  async register(data: {
    name: string
    email: string
    password: string
    role?: string
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
    }

    return response.json()
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้')
    }

    return response.json()
  },
}

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

