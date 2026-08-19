import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../types'
import * as api from '../services/api'
import { setToken, removeToken } from '../lib/api'

const USER_KEY = 'user'

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<import('../types').AuthResponse>
  updateStudentProfile: (profile: { firstName: string; lastName: string }) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await api.login(credentials)
    setToken(res.accessToken)
    setTokenState(res.accessToken)
    setUser(res.user)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const res = await api.register(credentials)
    if (res.user.status === 'active') {
      setToken(res.accessToken)
      setTokenState(res.accessToken)
      setUser(res.user)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    }
    return res
  }, [])

  const logout = useCallback(() => {
    removeToken()
    localStorage.removeItem(USER_KEY)
    setTokenState(null)
    setUser(null)
  }, [])

  const updateStudentProfile = useCallback(async (profile: { firstName: string; lastName: string }) => {
    const updatedUser = await api.updateStudentProfile(profile)
    setUser(updatedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        updateStudentProfile,
        logout,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
