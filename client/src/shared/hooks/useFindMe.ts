import { useQuery } from '@tanstack/react-query'
import { findMeService } from '@/shared/service/findMeService'

export const useFindMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: findMeService,
    retry: false,
  })
}
