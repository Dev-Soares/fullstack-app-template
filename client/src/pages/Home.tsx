import { useUser } from '@/shared/contexts/userContext'
import { Spinner } from '@/shared/components/Spinner'

export const Home = () => {
  const { user, isPending } = useUser()

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {user ? `Olá, ${user.name}` : 'App Template'}
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Ready to build
      </p>
    </div>
  )
}
