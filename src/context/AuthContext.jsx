import { useMemo, useState } from "react";
import { AuthContext } from "./authContext";

function decodeUserId(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).sub ?? null;
  } catch {
    return null;
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

function readAuthResponse(data) {
  return {
    token: data.token || data.accessToken || data.access_token || data.jwt,
    user: data.user || { name: data.name, email: data.email },
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      userId: token ? decodeUserId(token) : null,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
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
