import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signInSchema, type SignInData } from '../types/signIn'
import { signInService } from '../service/signInService'
import { useNavigateTo } from '@/shared/hooks/useNavigateTo'
import toast from 'react-hot-toast'

export const useSignIn = () => {
  const queryClient = useQueryClient()
  const navigateTo = useNavigateTo()

  const form = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const mutation = useMutation({
    mutationFn: signInService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigateTo('/')
    },
    onError: () => {
      toast.error('E-mail ou senha inválidos.')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { ...form, onSubmit, isPending: mutation.isPending }
}
