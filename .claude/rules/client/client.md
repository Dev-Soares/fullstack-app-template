---
globs: client/**
---

# Frontend Rules

## Tech Stack

- React 19, TypeScript, Tailwind CSS v4 (ONLY styling — via `@tailwindcss/vite`), React Router v7
- TanStack Query v5 (server state), Axios (HTTP client)
- React Hook Form v7 + Zod v4 (forms via `zodResolver`), React Hot Toast (notifications)
- Phosphor Icons (`@phosphor-icons/react`), Custom font: `Outfit`
- Dark mode: `darkMode: 'class'` (toggle in `shared/contexts/themeContext`)

## Project Structure

```
src/
  pages/          # Route-level — layout composition + module hooks only
  modules/        # Feature-based architecture
  shared/         # Global reusable code
  api/            # HTTP client config (axios instance + interceptors)
```

## Module Structure (MANDATORY — exact names)

```
modules/<feature>/
  components/     # Feature UI components
  hooks/          # TanStack Query hooks + logic
  service/        # API functions (ONE file per action) — NEVER `services/`
  types/          # TypeScript types + Zod schemas — NEVER `schemas/`
  skeletons/      # Loading skeletons (MANDATORY for every module)
  contexts/       # (optional) Feature-specific contexts
  config/         # (optional) Feature-specific constants
```

## Shared Structure

```
shared/
  components/     # Reusable UI (Input, Spinner, Toast, ToggleTheme, ErrorMessage...)
  hooks/          # Generic hooks (useNavigateTo, useFindMe...)
  contexts/       # Global contexts (userContext, themeContext)
  layouts/        # Layout components (Header, Sidebar, BottomNav, Content)
  services/       # Global services (findMeService, etc.)
  utils/          # Pure utility functions
```

Used in 2+ modules → `shared/`. Shared MUST NOT import from modules. No business logic in shared.

## API Layer (`src/api/`)

- `axios.ts` — configured axios instance (base URL, headers, defaults)
- `interceptors/` — axios interceptors (e.g. forbidden-interceptor.ts)
- Infrastructure only — no domain knowledge, no feature functions, no business logic

## Pages Layer

Pages orchestrate, NOT implement. Compose components from modules + call module hooks.
FORBIDDEN: business logic, direct API calls, creating components, complex state.

## Data Flow (STRICT)

```
UI (Component/Page) → Hook (TanStack Query) → Service function → api/axios
```

FORBIDDEN: Component→service ❌ | Component→axios ❌ | Hook→axios ❌ | Page→service ❌ | shared→modules ❌ | modules→pages ❌

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `PascalCase.tsx` | `FeatureCard.tsx` |
| Hook | `use[Action][Entity].ts` | `useCreateFeature.ts` |
| Service | `[action][Entity]Service.ts` | `createFeatureService.ts` |
| Type | `[entity\|action].ts` | `feature.ts`, `createFeature.ts` |
| Skeleton | `[Feature]Skeleton.tsx` | `FeatureSkeleton.tsx` |

## State Strategy

| Type | Tool | Where |
|------|------|-------|
| Server data | TanStack Query (`useQuery`/`useMutation`) | `modules/<feature>/hooks/` |
| UI-only (modals, toggles) | `useState` | Component level |
| Global (auth, theme) | React Context | `shared/contexts/` |
| Forms | React Hook Form + Zod | hooks/ + types/ |

NEVER: `useState+useEffect` for server data | API data in `useState` | Context for feature data | mix server/client state.

## Styling (Tailwind v4 ONLY)

- Classes directly in JSX — NO `style={{}}`, NO styled-components, NO .css/.scss
- Rounded: `rounded-xl`/`rounded-2xl` | Shadows: `shadow-sm`/`shadow-md`
- Borders: `border border-neutral-200 dark:border-neutral-700`
- Interactions: `hover:bg-neutral-100 transition-all duration-200`
- Always `dark:` variants for bg, text, borders
- Spacing: `p-4`, `p-6`, `gap-4`, `gap-6` — whitespace over clutter
- Typography: intentional sizes (`text-sm`→`text-xl`) + weights (`font-medium`→`font-bold`)
- Notifications: React Hot Toast
- Quality: modern, minimal, SaaS-level — never generic/template-looking

## Anti-Patterns (FORBIDDEN)

- Logic inside pages/JSX, God components, prop drilling
- Direct API usage outside service layer
- `services/` (must be `service/`), `schemas/` (must be `types/`), missing `skeletons/`
- `useState` for server data or forms
- Mixing styling approaches, inline styles
- Duplicated logic across modules
- Components coupled to specific data formats

Any violation → STOP → Refactor before continuing.
