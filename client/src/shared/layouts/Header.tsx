import { SignOut } from '@phosphor-icons/react'
import { ToggleTheme } from '@/shared/components/ToggleTheme'
import { useLogout } from '@/modules/auth/hooks/useLogout'

export const Header = () => {
  const { mutate: logout, isPending } = useLogout()

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        App Template
      </span>
      <div className="flex items-center gap-2">
        <ToggleTheme />
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          aria-label="Sair"
        >
          <SignOut size={18} weight="bold" className="text-neutral-600 dark:text-neutral-300" />
        </button>
      </div>
    </header>
  )
}
