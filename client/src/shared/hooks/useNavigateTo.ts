import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

export const useNavigateTo = () => {
  const navigate = useNavigate()

  return useCallback((path: string) => navigate(path), [navigate])
}
