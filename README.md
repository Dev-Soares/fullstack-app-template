# Fullstack App Template

Monorepo pnpm workspaces. Backend NestJS + frontend React + Vite, com regras de código **opinativas e dual-CLI** — funciona com Claude Code e opencode (Kimi K2.6).

---

## Stack

| Camada | Tech |
|---|---|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, JWT (cookie httpOnly), bcrypt, helmet, ThrottlerModule, nestjs-pino, Swagger |
| Frontend | React 19, TypeScript, Vite, Tailwind v4, React Router v7, TanStack Query v5, React Hook Form v7 + Zod v4, Axios, Phosphor Icons |
| Tooling | pnpm workspaces, Docker Compose (Postgres local), ESLint, Prettier |

---

## Estrutura

```
fullstack-app-template/
  AGENTS.md                # Entrypoint opencode/Kimi (system prompt + projeto)
  CLAUDE.md                # Entrypoint Claude Code
  client/
    AGENTS.md              # Rules frontend (auto-load opencode em client/**)
    src/{pages,modules,shared,api}
  server/
    AGENTS.md              # Rules backend (auto-load opencode em server/**)
    src/{modules,common}
    prisma/schema.prisma
  .claude/rules/           # Rules Claude Code (auto-load via glob frontmatter)
    client/{client,components,data-flow}.md
    server/{server,auth,controllers,services}.md
  docker-compose.yml       # PostgreSQL local
  pnpm-workspace.yaml
```

---

## Quick Start

```bash
# 1. Instalar deps
pnpm install

# 2. Banco local
docker compose up -d

# 3. Migrations + Prisma client
pnpm --filter server exec prisma migrate dev
pnpm --filter server exec prisma generate

# 4. Env vars (copiar .env.example pra .env em server/ e client/)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 5. Rodar tudo
pnpm dev
```

### Comandos úteis

```bash
pnpm dev                                          # Backend + frontend em paralelo
pnpm --filter server start:dev                    # Só backend
pnpm --filter client dev                          # Só frontend
pnpm build                                        # Build completo
pnpm --filter server exec prisma studio           # UI do banco
pnpm --filter server exec prisma migrate dev      # Nova migration
```

---

## AI Coding Agents — Dual CLI Setup

Projeto tem regras de código opinativas (arquitetura, validação, segurança) carregadas automaticamente pelo agent que você usar. Suporta **dois CLIs simultaneamente**.

### Arquivos de configuração

| Arquivo | Lido por | Quando |
|---|---|---|
| `CLAUDE.md` (raiz) | Claude Code | Sempre |
| `.claude/rules/<scope>/*.md` | Claude Code | Auto via frontmatter `globs:` (escopo `client/**` ou `server/**`) |
| `AGENTS.md` (raiz) | opencode | Sempre |
| `server/AGENTS.md` | opencode | Auto ao tocar arquivos `server/**` (traversal) |
| `client/AGENTS.md` | opencode | Auto ao tocar arquivos `client/**` (traversal) |

### Por que dois?

- **Claude Code** lê glob frontmatter (`globs: server/**` no topo do arquivo) e carrega rules condicionalmente. Não lê `AGENTS.md`.
- **Opencode/Kimi** ignora glob frontmatter mas faz traversal — carrega `AGENTS.md` do diretório atual e ancestrais. Não lê `.claude/rules/`.

Resultado: mesmas regras, dois formatos. Editou rule? Atualize ambos (`.claude/rules/<scope>/<file>.md` + seção correspondente em `<scope>/AGENTS.md`).

---

## Setup Claude Code

Não precisa configuração — Claude Code detecta `CLAUDE.md` e `.claude/rules/` automaticamente.

```bash
# Instalar Claude Code (se ainda não tem)
npm i -g @anthropic-ai/claude-code

# Rodar na raiz do projeto
cd fullstack-app-template
claude
```

---

## Setup opencode + Kimi K2.6

### 1. Instalar opencode

```bash
# macOS / Linux / WSL
curl -fsSL https://opencode.ai/install | bash

# ou via npm
npm i -g opencode-ai
```

Verifica:

```bash
opencode --version
```

### 2. Obter API key Moonshot

Crie conta em [platform.kimi.ai](https://platform.kimi.ai/) e gere uma API key. Adicione saldo (Kimi cobra por token).

Alternativa: [AtlasCloud](https://atlascloud.ai), que faz proxy para Moonshot e cobra em USD com mesma API.

### 3. Configurar opencode

Crie `~/.config/opencode/opencode.json` (global) ou `opencode.json` na raiz do projeto (override local):

#### Opção A — Moonshot direto

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "moonshot": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Moonshot",
      "options": {
        "baseURL": "https://api.moonshot.ai/v1",
        "apiKey": "{env:MOONSHOT_API_KEY}"
      },
      "models": {
        "kimi-k2.6": { "name": "Kimi K2.6" }
      }
    }
  },
  "model": "moonshot/kimi-k2.6"
}
```

Export da key:

```bash
# bash/zsh — adicione no ~/.bashrc ou ~/.zshrc
export MOONSHOT_API_KEY="sk-..."

# PowerShell — sessão atual
$env:MOONSHOT_API_KEY = "sk-..."

# PowerShell — persistente (user)
[Environment]::SetEnvironmentVariable("MOONSHOT_API_KEY", "sk-...", "User")
```

#### Opção B — via AtlasCloud

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "atlascloud": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "AtlasCloud",
      "options": {
        "baseURL": "https://api.atlascloud.ai/v1",
        "apiKey": "{env:ATLASCLOUD_API_KEY}"
      },
      "models": {
        "moonshot/kimi-k2.6": { "name": "Kimi K2.6" }
      }
    }
  },
  "model": "atlascloud/moonshot/kimi-k2.6"
}
```

> **Nota:** `@ai-sdk/openai-compatible` é mandatório. O provider built-in `openai` do opencode strippa o prefixo `openai/` do model ID e quebra routing em endpoints third-party.

### 4. Rodar opencode no projeto

```bash
cd fullstack-app-template
opencode
```

Opencode carregará automaticamente:
- `AGENTS.md` (raiz) — system prompt sênior + contexto do projeto
- `server/AGENTS.md` ou `client/AGENTS.md` — quando você mexer em arquivos do escopo

### 5. Verificar carregamento das rules

Pergunte ao Kimi:

```
Quais rules estão carregadas no contexto agora? Liste seções.
```

Se retornar referências às seções "Controllers", "Services", "Forms", etc — está funcionando. Se não, valide o caminho dos AGENTS.md e relativize do CWD.

---

## Como editar regras de código

Source-of-truth está em **dois lugares** que precisam ficar sincronizados:

```
.claude/rules/server/services.md  ←→  server/AGENTS.md (seção Services)
.claude/rules/server/auth.md      ←→  server/AGENTS.md (seções Auth + Guards + Security)
.claude/rules/server/controllers.md  ←→  server/AGENTS.md (seções Controllers + DTOs)
.claude/rules/server/server.md    ←→  server/AGENTS.md (seção Architecture Overview)

.claude/rules/client/client.md       ←→  client/AGENTS.md (seção Architecture)
.claude/rules/client/components.md   ←→  client/AGENTS.md (seções Components + Forms)
.claude/rules/client/data-flow.md    ←→  client/AGENTS.md (seções Service + Hooks Layer)
```

Editou rule num lado, espelhe no outro. Divergência é bug.

---

## Princípios herdados (resumo)

Documentos normativos (`AGENTS.md`, `CLAUDE.md`, `<scope>/AGENTS.md`, `.claude/rules/`) impõem:

- TypeScript strict, **sem `any`** (use `unknown` + narrow ou Zod)
- Validação em **fronteira** (DTOs no backend, Zod schemas no frontend)
- Backend: Controller fino → Service grosso → Prisma. Erros em pt-BR. Auth via cookie httpOnly
- Frontend: Component → Hook (TanStack Query) → Service → Axios. Tailwind v4 only
- Segurança não-negociável: sem secret no client, sem token em localStorage, sem SQL interpolation
- Commits pequenos, PRs focados, ações destrutivas confirmam antes

Detalhes completos em `AGENTS.md` raiz e `<scope>/AGENTS.md`.

---

## Troubleshooting

**Opencode não carrega `<scope>/AGENTS.md` automaticamente:**
- Confirme que está rodando dentro do diretório correto (`pwd` deve estar dentro de `client/` ou `server/` ao editar arquivos lá)
- Force load: cite explicitamente `@server/AGENTS.md` na primeira mensagem

**Kimi K2.6 retorna erro 401 / quota:**
- Cheque saldo em [platform.kimi.ai/billing](https://platform.kimi.ai/) ou AtlasCloud
- Confirme `MOONSHOT_API_KEY` exportada na shell atual: `echo $MOONSHOT_API_KEY`

**Rule não está sendo seguida pelo agent:**
- Pergunte: "leia `<scope>/AGENTS.md` antes de continuar"
- Se persistir, valide que arquivo não tem typo no path e está commitado

**Diff entre `.claude/rules/` e `<scope>/AGENTS.md`:**
- Drift conhecido. Ressincronize manualmente. Considere script `scripts/sync-rules.sh` se virar problema recorrente.

---

## Referências

- [Opencode docs](https://opencode.ai/docs/)
- [Opencode rules](https://opencode.ai/docs/rules/)
- [Opencode providers](https://opencode.ai/docs/providers/)
- [Kimi K2.6 quickstart](https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart)
- [Claude Code](https://docs.claude.com/claude-code)
