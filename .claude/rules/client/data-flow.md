---
globs: client/**
---

# Data Flow & State Rules

## Service Layer (`modules/<feature>/service/`)

One file per action. Folder name is `service/` (singular).

```typescript
// modules/feature/service/getFeatureService.ts
import { api } from '@/api/axios'
import type { Feature } from '../types/feature'

export const getFeatureService = async (id: string): Promise<Feature> => {
  const { data } = await api.get(`/feature/${id}`)
  return data
}
```

```typescript
// modules/feature/service/createFeatureService.ts
import { api } from '@/api/axios'
import type { CreateFeatureData } from '../types/createFeature'
import type { Feature } from '../types/feature'

export const createFeatureService = async (body: CreateFeatureData): Promise<Feature> => {
  const { data } = await api.post('/feature', body)
  return data
}
```

Rules:
- Import `api` from `@/api/axios`
- Pure functions — no hooks, no state, no UI logic, no toasts
- Return raw response data

## Hooks Layer (`modules/<feature>/hooks/`)

Naming: `use[Action][Entity].ts`

### Query (GET)

```typescript
import { useQuery } from '@tanstack/react-query'
import { getFeatureService } from '../service/getFeatureService'

export const useGetFeature = (id: string) => {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => getFeatureService(id),
  })
}
```

### Mutation (POST/PATCH/DELETE)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFeatureService } from '../service/createFeatureService'
import type { CreateFeatureData } from '../types/createFeature'

export const useCreateFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFeatureData) => createFeatureService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature'] })
    },
  })
}
```

Rules:
- Call service functions, NEVER axios directly
- Invalidate queries on mutations via `queryClient.invalidateQueries()`
- Consistent queryKeys: `['feature']`, `['feature', id]`
- No UI rendering in hooks
- NEVER use `useState+useEffect` for server data — always TanStack Query

## Component Usage

```typescript
const { data, isPending, isError } = useGetFeature(id)

if (isPending) return <FeatureSkeleton />
if (isError) return <ErrorMessage />
return <FeatureCard data={data} />
```

- Use hooks to access data — NEVER call services or axios directly
- Let TanStack Query manage error state (`isError`, `error`)
- Access error state from hooks in components — don't handle API errors in components

## Error Handling

- Let TanStack Query manage error state
- Don't leak raw axios errors to UI
- Don't handle API errors inside components

## Scalability Rule

For each new feature:
1. Create service functions in `modules/<feature>/service/`
2. Create hooks using TanStack Query
3. Use hooks in UI components
4. NEVER skip layers
