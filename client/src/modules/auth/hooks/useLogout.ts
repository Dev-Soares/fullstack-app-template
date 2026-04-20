import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutService } from '../service/logoutService'
import { useNavigateTo } from '@/shared/hooks/useNavigateTo'

export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigateTo = useNavigateTo()

  return useMutation({
    mutationFn: logoutService,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      navigateTo('/login')
    },
  })
}
