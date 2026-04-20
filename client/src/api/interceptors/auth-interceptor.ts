import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'

export const handleAuthError = (error: AxiosError) => {
  const status = error.response?.status

  if (status === 401) {
    window.location.href = '/login'
  }

  if (status === 403) {
    toast.error('Você não tem permissão para realizar esta ação.')
  }

  return Promise.reject(error)
}
