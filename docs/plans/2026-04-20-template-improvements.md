# Plano de Implementação: Melhorias do Template Fullstack

> **Para Claude:** SUB-HABILIDADE OBRIGATÓRIA: Usar codepowers:execute-plan para implementar este plano tarefa por tarefa.

**Objetivo:** Tornar o template completo e consistente com as regras do CLAUDE.md — adicionar auth flow no client, corrigir convenções, e melhorar server.

**Arquitetura:** O client segue feature-based modules (modules/<feature>/) com data flow Component → Hook → Service → axios. O server é NestJS com controller → service → prisma. Auth usa JWT em HTTP-only cookies.

**Pilha de Tecnologias:** React 19, TanStack Query v5, React Hook Form v7, Zod v4, Tailwind v4, Axios, NestJS 11, Prisma 7

---

### Tarefa 1: Server — Fix `remove()` select + HealthController throttle skip + Swagger decorators

**Arquivos:**

- Modificar: `server/src/modules/user/user.service.ts:115-126`
- Modificar: `server/src/modules/health/health.controller.ts`
- Modificar: `server/src/modules/user/user.controller.ts`
- Modificar: `server/src/modules/auth/auth.controller.ts`

**Passo 1: Adicionar `select` no `UserService.remove()`**

Em `server/src/modules/user/user.service.ts`, substituir o método `remove`:

```typescript
async remove(id: string): Promise<UserPublic> {
  try {
    return await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') throw new NotFoundException('Usuário não encontrado');
    }
    throw new InternalServerErrorException('Erro ao deletar usuário');
  }
}
```

**Passo 2: Adicionar `@SkipThrottle()` no HealthController**

```typescript
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok' };
  }
}
```

**Passo 3: Adicionar Swagger decorators no UserController**

Adicionar `@ApiTags('User')` na classe e `@ApiOperation` em cada método:

```typescript
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  // ... constructor

  @Post()
  @ApiOperation({ summary: 'Criar usuário' })
  create(@Body() createUserDto: CreateUserDto) { ... }

  @UseGuards(OptionalAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Buscar usuário autenticado' })
  async findMe(@Req() req: OptionalAuthRequest) { ... }

  @UseGuards(AuthGuard, OwnershipGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) { ... }

  @Patch(':id')
  @UseGuards(AuthGuard, OwnershipGuard)
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto) { ... }

  @Delete(':id')
  @UseGuards(AuthGuard, OwnershipGuard)
  @ApiOperation({ summary: 'Remover usuário' })
  remove(@Param('id') id: string) { ... }
}
```

**Passo 4: Adicionar Swagger decorators no AuthController**

```typescript
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // ... constructor

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário' })
  async signIn(...) { ... }

  @Post('logout')
  @ApiOperation({ summary: 'Encerrar sessão' })
  logout(...) { ... }
}
```

**Passo 5: Verificar build do server**

Executar: `pnpm --filter server build`
Esperado: Build sem erros

**Passo 6: Commit**

```bash
git add server/src/modules/user/user.service.ts server/src/modules/health/health.controller.ts server/src/modules/user/user.controller.ts server/src/modules/auth/auth.controller.ts
git commit -m "fix(server): add select to remove, skip throttle on health, add swagger decorators"
```

---

### Tarefa 2: Client — Renomear `shared/services/` → `shared/service/` + fix findMeService

**Arquivos:**

- Renomear: `client/src/shared/services/` → `client/src/shared/service/`
- Modificar: `client/src/shared/service/findMeService.ts` (fix error handling)
- Modificar: `client/src/shared/hooks/useFindMe.ts` (update import)

**Passo 1: Renomear pasta e corrigir findMeService**

```bash
mv client/src/shared/services client/src/shared/service
```

**Passo 2: Corrigir `findMeService` — remover try/catch silencioso**

O TanStack Query gerencia erros. O service deve simplesmente retornar ou propagar o erro.

```typescript
// client/src/shared/service/findMeService.ts
import { api } from '@/api/axios'

interface MeResponse {
  id: string
  name: string
  email: string
}

export const findMeService = async (): Promise<MeResponse | null> => {
  const { data } = await api.get<MeResponse>('/user/me')
  return data
}
```

**Passo 3: Atualizar import no useFindMe**

```typescript
// client/src/shared/hooks/useFindMe.ts
import { useQuery } from '@tanstack/react-query'
import { findMeService } from '@/shared/service/findMeService'

export const useFindMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: findMeService,
    retry: false,
  })
}
```

**Passo 4: Commit**

```bash
git add client/src/shared/service/ client/src/shared/hooks/useFindMe.ts
git rm -r client/src/shared/services/
git commit -m "refactor(client): rename services to service, fix findMeService error handling"
```

---

### Tarefa 3: Client — Axios interceptor para 401/403

**Arquivos:**

- Criar: `client/src/api/interceptors/auth-interceptor.ts`
- Modificar: `client/src/api/axios.ts`

**Passo 1: Criar auth-interceptor**

```typescript
// client/src/api/interceptors/auth-interceptor.ts
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'

export const handleAuthError = (error: AxiosError) => {
  const status = error.response?.status

  if (status === 401) {
    window.location.href = '/login'
  }

  if (status === 403) {
    toast.error('Você não tem permissão para realizar esta ação.')
  }

  return Promise.reject(error)
}
```

**Passo 2: Registrar interceptor no axios**

```typescript
// client/src/api/axios.ts
import axios from 'axios'
import { handleAuthError } from './interceptors/auth-interceptor'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.response.use((response) => response, handleAuthError)
```

**Passo 3: Commit**

```bash
git add client/src/api/
git commit -m "feat(client): add auth interceptor for 401/403 handling"
```

---

### Tarefa 4: Client — Conectar `userContext` com `useFindMe`

**Arquivos:**

- Modificar: `client/src/shared/contexts/userContext.tsx`

**Passo 1: Reescrever userContext integrando TanStack Query**

O `UserProvider` deve usar `useFindMe()` internamente. Deve estar dentro de `QueryClientProvider` (já está no main.tsx). Expor `user`, `isPending`, `isError`.

```typescript
// client/src/shared/contexts/userContext.tsx
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
```

**Passo 2: Commit**

```bash
git add client/src/shared/contexts/userContext.tsx
git commit -m "feat(client): connect userContext with useFindMe via TanStack Query"
```

---

### Tarefa 5: Client — Shared Input component

**Arquivos:**

- Criar: `client/src/shared/components/Input.tsx`

**Passo 1: Criar Input genérico com suporte a React Hook Form**

```typescript
// client/src/shared/components/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500 ${error ? 'border-red-400 dark:border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 dark:text-red-400">{error}</span>
        )}
      </div>
    )
  },
)
```

**Passo 2: Commit**

```bash
git add client/src/shared/components/Input.tsx
git commit -m "feat(client): add shared Input component with RHF support"
```

---

### Tarefa 6: Client — Módulo auth (types + service)

**Arquivos:**

- Criar: `client/src/modules/auth/types/signIn.ts`
- Criar: `client/src/modules/auth/types/signUp.ts`
- Criar: `client/src/modules/auth/service/signInService.ts`
- Criar: `client/src/modules/auth/service/signUpService.ts`
- Criar: `client/src/modules/auth/service/logoutService.ts`

**Passo 1: Criar Zod schemas + tipos**

```typescript
// client/src/modules/auth/types/signIn.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export type SignInData = z.infer<typeof signInSchema>
```

```typescript
// client/src/modules/auth/types/signUp.ts
import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export type SignUpData = z.infer<typeof signUpSchema>
```

**Passo 2: Criar service functions**

```typescript
// client/src/modules/auth/service/signInService.ts
import { api } from '@/api/axios'
import type { SignInData } from '../types/signIn'

export const signInService = async (data: SignInData): Promise<{ message: string }> => {
  const { data: response } = await api.post('/auth/login', data)
  return response
}
```

```typescript
// client/src/modules/auth/service/signUpService.ts
import { api } from '@/api/axios'
import type { SignUpData } from '../types/signUp'

interface SignUpResponse {
  id: string
  name: string
  email: string
}

export const signUpService = async (data: SignUpData): Promise<SignUpResponse> => {
  const { data: response } = await api.post('/user', data)
  return response
}
```

```typescript
// client/src/modules/auth/service/logoutService.ts
import { api } from '@/api/axios'

export const logoutService = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/logout')
  return data
}
```

**Passo 3: Commit**

```bash
git add client/src/modules/auth/types/ client/src/modules/auth/service/
git commit -m "feat(client): add auth module types and service layer"
```

---

### Tarefa 7: Client — Módulo auth (hooks)

**Arquivos:**

- Criar: `client/src/modules/auth/hooks/useSignIn.ts`
- Criar: `client/src/modules/auth/hooks/useSignUp.ts`
- Criar: `client/src/modules/auth/hooks/useLogout.ts`

**Passo 1: Criar hooks**

```typescript
// client/src/modules/auth/hooks/useSignIn.ts
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
```

```typescript
// client/src/modules/auth/hooks/useSignUp.ts
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { signUpSchema, type SignUpData } from '../types/signUp'
import { signUpService } from '../service/signUpService'
import { useNavigateTo } from '@/shared/hooks/useNavigateTo'
import toast from 'react-hot-toast'

export const useSignUp = () => {
  const navigateTo = useNavigateTo()

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  })

  const mutation = useMutation({
    mutationFn: signUpService,
    onSuccess: () => {
      toast.success('Conta criada com sucesso!')
      navigateTo('/login')
    },
    onError: () => {
      toast.error('Erro ao criar conta. Tente novamente.')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { ...form, onSubmit, isPending: mutation.isPending }
}
```

```typescript
// client/src/modules/auth/hooks/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutService } from '../service/logoutService'
import { useNavigateTo } from '@/shared/hooks/useNavigateTo'

export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigateTo = useNavigateTo()

  return useMutation({
    mutationFn: logoutService,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      navigateTo('/login')
    },
  })
}
```

**Passo 2: Commit**

```bash
git add client/src/modules/auth/hooks/
git commit -m "feat(client): add auth hooks (signIn, signUp, logout)"
```

---

### Tarefa 8: Client — Módulo auth (components + skeleton)

**Arquivos:**

- Criar: `client/src/modules/auth/components/SignInForm.tsx`
- Criar: `client/src/modules/auth/components/SignUpForm.tsx`
- Criar: `client/src/modules/auth/skeletons/AuthSkeleton.tsx`

**Passo 1: Criar SignInForm**

```tsx
// client/src/modules/auth/components/SignInForm.tsx
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
```

**Passo 2: Criar SignUpForm**

```tsx
// client/src/modules/auth/components/SignUpForm.tsx
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
```

**Passo 3: Criar AuthSkeleton**

```tsx
// client/src/modules/auth/skeletons/AuthSkeleton.tsx
const AuthSkeleton = () => (
  <div className="flex w-full max-w-sm animate-pulse flex-col gap-5">
    <div className="flex flex-col gap-2">
      <div className="h-7 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
    <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
  </div>
)

export default AuthSkeleton
```

**Passo 4: Commit**

```bash
git add client/src/modules/auth/components/ client/src/modules/auth/skeletons/
git commit -m "feat(client): add auth forms and skeleton components"
```

---

### Tarefa 9: Client — Layouts (AuthLayout, AppLayout, Header)

**Arquivos:**

- Criar: `client/src/shared/layouts/AuthLayout.tsx`
- Criar: `client/src/shared/layouts/AppLayout.tsx`
- Criar: `client/src/shared/layouts/Header.tsx`
- Remover: `client/src/shared/layouts/.gitkeep`

**Passo 1: Criar AuthLayout**

Layout centralizado para páginas de login/register.

```tsx
// client/src/shared/layouts/AuthLayout.tsx
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
```

**Passo 2: Criar Header**

```tsx
// client/src/shared/layouts/Header.tsx
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
```

**Passo 3: Criar AppLayout**

```tsx
// client/src/shared/layouts/AppLayout.tsx
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
```

**Passo 4: Remover .gitkeep**

```bash
rm client/src/shared/layouts/.gitkeep
```

**Passo 5: Commit**

```bash
git add client/src/shared/layouts/
git commit -m "feat(client): add AuthLayout, AppLayout, and Header"
```

---

### Tarefa 10: Client — Páginas de auth + rotas + atualizar Home

**Arquivos:**

- Criar: `client/src/pages/SignIn.tsx`
- Criar: `client/src/pages/SignUp.tsx`
- Modificar: `client/src/pages/Home.tsx`
- Modificar: `client/src/App.tsx`
- Remover: `client/src/modules/.gitkeep`

**Passo 1: Criar página SignIn**

```tsx
// client/src/pages/SignIn.tsx
import SignInForm from '@/modules/auth/components/SignInForm'

export const SignIn = () => <SignInForm />
```

**Passo 2: Criar página SignUp**

```tsx
// client/src/pages/SignUp.tsx
import SignUpForm from '@/modules/auth/components/SignUpForm'

export const SignUp = () => <SignUpForm />
```

**Passo 3: Atualizar Home para usar dados do contexto**

```tsx
// client/src/pages/Home.tsx
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
```

**Passo 4: Atualizar App.tsx com rotas + layouts**

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { Home } from '@/pages/Home'
import { SignIn } from '@/pages/SignIn'
import { SignUp } from '@/pages/SignUp'

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
```

**Passo 5: Remover .gitkeep do modules**

```bash
rm client/src/modules/.gitkeep
```

**Passo 6: Verificar build do client**

Executar: `pnpm --filter client build`
Esperado: Build sem erros

**Passo 7: Commit**

```bash
git add client/src/pages/ client/src/App.tsx client/src/modules/
git commit -m "feat(client): add auth pages, routes with layouts, update Home"
```

---

### Tarefa 11: Limpeza final — remover .gitkeep desnecessários + verificar build completo

**Arquivos:**

- Remover: `client/src/shared/utils/.gitkeep` (se existir)

**Passo 1: Build completo**

Executar: `pnpm build`
Esperado: Server e client compilam sem erros

**Passo 2: Commit final**

```bash
git add -A
git commit -m "chore: cleanup gitkeep files"
```

---

## Resumo de Arquivos

### Novos (client)
- `src/api/interceptors/auth-interceptor.ts`
- `src/shared/components/Input.tsx`
- `src/shared/layouts/AuthLayout.tsx`
- `src/shared/layouts/AppLayout.tsx`
- `src/shared/layouts/Header.tsx`
- `src/modules/auth/types/signIn.ts`
- `src/modules/auth/types/signUp.ts`
- `src/modules/auth/service/signInService.ts`
- `src/modules/auth/service/signUpService.ts`
- `src/modules/auth/service/logoutService.ts`
- `src/modules/auth/hooks/useSignIn.ts`
- `src/modules/auth/hooks/useSignUp.ts`
- `src/modules/auth/hooks/useLogout.ts`
- `src/modules/auth/components/SignInForm.tsx`
- `src/modules/auth/components/SignUpForm.tsx`
- `src/modules/auth/skeletons/AuthSkeleton.tsx`
- `src/pages/SignIn.tsx`
- `src/pages/SignUp.tsx`

### Modificados (client)
- `src/api/axios.ts` — registrar interceptor
- `src/shared/contexts/userContext.tsx` — integrar com useFindMe
- `src/shared/hooks/useFindMe.ts` — fix import path
- `src/shared/service/findMeService.ts` — rename + fix error handling
- `src/pages/Home.tsx` — usar contexto do usuário
- `src/App.tsx` — adicionar rotas + layouts

### Modificados (server)
- `src/modules/user/user.service.ts` — select no remove
- `src/modules/health/health.controller.ts` — SkipThrottle + Swagger
- `src/modules/user/user.controller.ts` — Swagger decorators
- `src/modules/auth/auth.controller.ts` — Swagger decorators

---

**Plano completo e salvo em `docs/plans/2026-04-20-template-improvements.md`. Duas opções de execução:**
1. **Orientado por subagentes (esta sessão)** — Eu envio um novo subagente para cada tarefa, revisão entre tarefas, iteração rápida
2. **Crie uma nova sessão paralela (separada)** — Abrir uma nova sessão do Claude Code e executar o comando `/execute-plan @docs/plans/2026-04-20-template-improvements.md`

**Qual abordagem prefere?**
