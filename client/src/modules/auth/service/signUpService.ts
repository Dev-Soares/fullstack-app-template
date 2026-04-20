import { api } from '@/api/axios'
import type { SignUpData } from '../types/signUp'

interface SignUpResponse {
  id: string
  name: string
  email: string
}

export const signUpService = async (data: SignUpData): Promise<SignUpResponse> => {
  const { data: response } = await api.post('/user', data)
  return response
}
