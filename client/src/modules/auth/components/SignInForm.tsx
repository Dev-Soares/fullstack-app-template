import { Input } from '@/shared/components/Input'
import { useSignIn } from '../hooks/useSignIn'
import { Link } from 'react-router-dom'

const SignInForm = () => {
  const { register, onSubmit, formState: { errors }, isPending } = useSignIn()

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Entrar
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Acesse sua conta para continuar
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Sua senha"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Não tem uma conta?{' '}
        <Link to="/register" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
          Criar conta
        </Link>
      </p>
    </form>
  )
}

export default SignInForm
