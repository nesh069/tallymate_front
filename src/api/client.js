import axios from 'axios'

let authToken = null
let unauthorizedHandler = null

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) unauthorizedHandler?.()
    return Promise.reject(error)
  },
)

export function setAuthToken(token) {
  authToken = token
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}
