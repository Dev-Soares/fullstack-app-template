import { Input } from '@/shared/components/Input'
import { useSignUp } from '../hooks/useSignUp'
import { Link } from 'react-router-dom'

const SignUpForm = () => {
  const { register, onSubmit, formState: { errors }, isPending } = useSignUp()

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Criar conta
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Preencha os dados para se cadastrar
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          placeholder="Seu nome"
          error={errors.name?.message}
          {...register('name')}
        />
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
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {isPending ? 'Criando...' : 'Criar conta'}
      </button>

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
          Entrar
        </Link>
      </p>
    </form>
  )
}

export default SignUpForm
