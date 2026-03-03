import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface User {
  address: string
  username?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Restore from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('whale_token')
    const savedUser = localStorage.getItem('whale_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = useCallback((user: User, token: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('whale_token', token)
    localStorage.setItem('whale_user', JSON.stringify(user))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('whale_token')
    localStorage.removeItem('whale_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
