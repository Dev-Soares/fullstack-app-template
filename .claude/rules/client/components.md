---
globs: client/**
---

# Components & Forms Rules

## Component Location

| Scenario | Location |
|----------|----------|
| Used in 1 feature | `modules/<feature>/components/` |
| Used in 2+ features | `shared/components/` |
| Page layout only | inline in `pages/` |

NEVER create components inside `pages/`. One component per file.

## Component Responsibility

- Single responsibility per component. Split at >150-200 lines
- Move ALL logic to hooks — keep components declarative
- Use props to receive data/actions. Strongly type all props (no `any`)
- If props become too complex → split component or move logic to hook

## File Structure

Simple: `ComponentName.tsx`
Complex: `ComponentName/index.tsx` + optional `types.ts`

## Skeleton Components (MANDATORY)

Every module MUST have `skeletons/` with loading skeletons for async components:

```typescript
// modules/feature/skeletons/FeatureSkeleton.tsx
const FeatureSkeleton = () => (
  <div className="animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800 p-4 flex flex-col gap-3">
    <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
    <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
    <div className="h-3 w-4/5 rounded bg-neutral-200 dark:bg-neutral-700" />
  </div>
)
export default FeatureSkeleton
```

Match skeleton layout to real component. Use `animate-pulse`.

## Conditional Rendering

```typescript
if (isPending) return <FeatureSkeleton />
if (isError) return <ErrorMessage />
return <FeatureCard data={data} />
```

Keep conditions clean — no complex ternaries inline in JSX.

## Shared Components

Must be: generic (no feature data), configurable via props, stateless or UI-only state, independent from modules. NEVER import from modules. NEVER contain business logic.

## Styling

Tailwind classes directly in JSX. No `style={{}}`, no styled-components, no CSS files.

---

# Forms (Zod + React Hook Form + zodResolver — MANDATORY)

## Schema + Type (in `modules/<feature>/types/`)

Zod schema IS the single source of truth. Export schema + inferred type from same file. NO `schemas/` folder. NO duplicate interfaces.

```typescript
// modules/auth/types/signIn.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export type SignInData = z.infer<typeof signInSchema>
```

## Form Hook (in `modules/<feature>/hooks/`)

```typescript
// modules/auth/hooks/useSignIn.ts
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { signInSchema, type SignInData } from '../types/signIn'
import { signInService } from '../service/signInService'

export const useSignIn = () => {
  const form = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: SignInData) => signInService(data),
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { ...form, onSubmit, isPending: mutation.isPending }
}
```

## Form Component (in `modules/<feature>/components/`)

```typescript
// modules/auth/components/LoginForm.tsx
import { useSignIn } from '../hooks/useSignIn'

const LoginForm = () => {
  const { register, onSubmit, formState: { errors }, isPending } = useSignIn()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <input {...register('email')} placeholder="E-mail" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      <div>
        <input type="password" {...register('password')} placeholder="Senha" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
```

## Form Rules

- Use `register` (uncontrolled) by default. `Controller` only for custom inputs without `ref` support
- NEVER: `useState` for form state | schema in component/hook | API calls in form components | duplicate interfaces alongside Zod types
- Reusable inputs (Input, PasswordInput) → `shared/components/`

## Form Data Flow

```
User Input → React Hook Form → Zod (zodResolver) → Hook onSubmit → TanStack mutation → Service → API
```
