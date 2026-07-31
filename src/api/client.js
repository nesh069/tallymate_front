import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'tallymate_token'
export const USER_STORAGE_KEY = 'tallymate_user'

let unauthorizedHandler = null

function storage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function clearStoredAuth() {
  try {
    storage()?.removeItem(TOKEN_STORAGE_KEY)
    storage()?.removeItem(USER_STORAGE_KEY)
  } catch {
    // Storage may be unavailable, such as in restricted browsing contexts.
  }
}

export function isUsableToken(token) {
  if (typeof token !== 'string' || !token.trim()) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function getStoredToken() {
  try {
    const token = storage()?.getItem(TOKEN_STORAGE_KEY)
    if (isUsableToken(token)) return token
  } catch {
    // Treat inaccessible storage as a logged-out session.
  }
  clearStoredAuth()
  return null
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const storedToken = getStoredToken()
  config.authenticatedRequest = Boolean(storedToken) || !config.url?.startsWith('/auth/')
  if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.authenticatedRequest) unauthorizedHandler?.()
    return Promise.reject(error)
  },
)

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}
