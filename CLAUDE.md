# Fullstack App Template

Monorepo com pnpm workspaces. Backend NestJS + Frontend React.

## Estrutura

```
fullstack-app-template/
  server/   # NestJS API (src/modules/, src/common/)
  client/   # React + Vite (src/pages/, src/modules/, src/shared/, src/api/)
```

## Comandos

```bash
pnpm dev                                          # Rodar tudo em paralelo
pnpm --filter server start:dev                    # Apenas backend
pnpm --filter client dev                          # Apenas frontend
pnpm build                                        # Build completo
docker compose up -d                              # PostgreSQL via Docker
pnpm --filter server exec prisma migrate dev      # Rodar migrations
pnpm --filter server exec prisma generate         # Gerar client Prisma
pnpm --filter server exec prisma studio           # UI do banco
```

## Regras de código

Carregadas automaticamente via `.claude/rules/` com globs:
- `server/**` → regras do backend
- `client/**` → regras do frontend

## Approach

- Think before acting. Read existing files before writing code.
- Prefer editing over rewriting whole files.
- Keep solutions simple and direct.
- User instructions always override this file.
