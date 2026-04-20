import axios from 'axios'
import { handleAuthError } from './interceptors/auth-interceptor'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.response.use((response) => response, handleAuthError)
