import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '@/shared/contexts/themeContext'

export const ToggleTheme = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      aria-label="Alternar tema"
    >
      {theme === 'light' ? (
        <Moon size={18} weight="bold" className="text-neutral-600" />
      ) : (
        <Sun size={18} weight="bold" className="text-neutral-300" />
      )}
    </button>
  )
}
