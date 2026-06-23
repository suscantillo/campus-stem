import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuthSession,
  getRefreshToken,
  loadStoredUser,
  saveAuthSession,
  type AuthResponse,
  type User,
} from '../lib/auth'
import { logout as logoutRequest } from '../lib/authApi'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  setSession: (data: AuthResponse) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser())

  const setSession = useCallback((data: AuthResponse) => {
    saveAuthSession(data)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken)
      } catch {
        // Best-effort: clear local session even if API fails.
      }
    }
    clearAuthSession()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      setSession,
      logout,
    }),
    [user, setSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
