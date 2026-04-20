import { createContext, useContext, type ReactNode } from 'react'
import { useFindMe } from '@/shared/hooks/useFindMe'
import { useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  name: string
  email: string
}

interface UserContextData {
  user: User | null
  isPending: boolean
  isError: boolean
  invalidateUser: () => void
}

const UserContext = createContext<UserContextData>({} as UserContextData)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isPending, isError } = useFindMe()
  const queryClient = useQueryClient()

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] })
  }

  return (
    <UserContext.Provider value={{ user: user ?? null, isPending, isError, invalidateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
