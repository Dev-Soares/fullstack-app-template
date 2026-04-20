import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { signUpSchema, type SignUpData } from '../types/signUp'
import { signUpService } from '../service/signUpService'
import { useNavigateTo } from '@/shared/hooks/useNavigateTo'
import toast from 'react-hot-toast'

export const useSignUp = () => {
  const navigateTo = useNavigateTo()

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  })

  const mutation = useMutation({
    mutationFn: signUpService,
    onSuccess: () => {
      toast.success('Conta criada com sucesso!')
      navigateTo('/login')
    },
    onError: () => {
      toast.error('Erro ao criar conta. Tente novamente.')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { ...form, onSubmit, isPending: mutation.isPending }
}
