import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken, setUnauthorizedHandler } from '../api/api'

const AuthContext = createContext(null)

function readAuthResponse(data) {
  return {
    token: data.token || data.accessToken || data.access_token || data.jwt,
    user: data.user || { name: data.name, email: data.email },
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => window.localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const storedToken = window.localStorage.getItem("token")
    if (!storedToken) return
    setAuthToken(storedToken)
    setToken(storedToken)
    api
      .get("/auth/me")
      .then((response) => {
        const data = response.data
        setUser(data.user || data)
      })
      .catch(() => {
        logout()
      })
  }, [logout])

  const authenticate = useCallback(async (path, payload) => {
    setIsLoading(true)
    try {
      const response = await api.post(path, payload)
      const nextAuth = readAuthResponse(response.data)
      if (!nextAuth.token) throw new Error('The server did not return an access token.')
      setAuthToken(nextAuth.token)
      setToken(nextAuth.token)
      setUser(nextAuth.user)
      return nextAuth.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateCurrency = useCallback(async (currency) => {
    const { data } = await api.patch("/auth/me", { currency });
    setUser(data.user || data);
  }, [])

  const value = useMemo(() => ({
    user, token, isAuthenticated: Boolean(token), isLoading,
    login: (credentials) => authenticate('/auth/login', credentials),
    signup: (details) => authenticate('/auth/signup', details),
    logout,
    setUser,
    updateCurrency,
  }), [authenticate, isLoading, logout, token, user, updateCurrency])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// This hook intentionally shares the same module as its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
