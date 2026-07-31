import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearStoredAuth, getStoredToken, setUnauthorizedHandler, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client'

const AuthContext = createContext(null)

function readStoredAuth() {
  const token = getStoredToken()
  if (!token) return { token: null, user: null }

  try {
    const user = JSON.parse(window.localStorage.getItem(USER_STORAGE_KEY))
    if (user && typeof user === 'object') return { token, user }
  } catch {
    // A malformed cached user must not prevent the app from loading.
  }

  clearStoredAuth()
  return { token: null, user: null }
}

function readAuthResponse(data) {
  return {
    token: data.token || data.accessToken || data.access_token || data.jwt,
    user: data.user || { name: data.name, email: data.email },
  }
}

function persistAuth({ token, user }) {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch {
    clearStoredAuth()
  }
}

export function AuthProvider({ children }) {
  const [storedAuth] = useState(readStoredAuth)
  const [user, setUser] = useState(storedAuth.user)
  const [token, setToken] = useState(storedAuth.token)
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const authenticate = useCallback(async (path, payload) => {
    setIsLoading(true)
    try {
      const response = await api.post(path, payload)
      const nextAuth = readAuthResponse(response.data)
      if (!nextAuth.token || !nextAuth.user) throw new Error('The server did not return valid authentication details.')
      persistAuth(nextAuth)
      setToken(nextAuth.token)
      setUser(nextAuth.user)
      return nextAuth.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(() => ({
    user, token, isAuthenticated: Boolean(token), isLoading,
    login: (credentials) => authenticate('/auth/login', credentials),
    signup: (details) => authenticate('/auth/signup', details),
    logout,
    setUser,
  }), [authenticate, isLoading, logout, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// This hook intentionally shares the same module as its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
