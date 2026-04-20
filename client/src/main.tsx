import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/shared/contexts/themeContext'
import { UserProvider } from '@/shared/contexts/userContext'
import { App } from '@/App'
import '@/styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <App />
          <Toaster position="top-right" />
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
