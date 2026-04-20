import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
    <Header />
    <main className="flex-1 p-6">
      <Outlet />
    </main>
  </div>
)
