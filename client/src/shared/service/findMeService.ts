import { api } from '@/api/axios'

interface MeResponse {
  id: string
  name: string
  email: string
}

export const findMeService = async (): Promise<MeResponse | null> => {
  const { data } = await api.get<MeResponse>('/user/me')
  return data
}
