import { Outlet } from 'react-router-dom'
import { ToggleTheme } from '@/shared/components/ToggleTheme'

export const AuthLayout = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
    <div className="absolute right-4 top-4">
      <ToggleTheme />
    </div>
    <Outlet />
  </div>
)
