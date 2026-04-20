---
globs: server/**
---

# Backend Rules

## Tech Stack

- NestJS, TypeScript, Prisma (ORM via `PrismaService` in `DatabaseModule`)
- JWT (auth via HTTP-only cookies), class-validator + `@nestjs/swagger` (DTOs)
- bcrypt via `HashService` (password hashing), nestjs-pino (logging), helmet + ThrottlerModule (security)

## Project Structure

```
src/
  modules/            # Feature-based modules (auth, user, database, health...)
  common/
    config/           # App-wide config (cookie.config.ts)
    filters/          # Global exception filters
    guards/auth/      # BaseJwtGuard, AuthGuard, OptionalAuthGuard, OwnershipGuard, AuthGuardModule
    hash/             # HashModule + HashService (bcrypt)
    types/            # Shared types (req-types, query-types)
    dto/              # Shared DTOs (e.g. pagination)
```

## Module Structure (FLAT FILES — MANDATORY)

```
modules/<feature>/
  <feature>.controller.ts   # HTTP layer (thin — 1-5 lines per method)
  <feature>.service.ts      # ALL business logic
  <feature>.module.ts       # NestJS module
  dto/                      # Input validation (class-validator + @nestjs/swagger)
    create-<feature>.dto.ts
    update-<feature>.dto.ts
```

NO `controllers/` or `services/` subfolders. NO `entities/` folder — output types are inline `Pick<>` in services.

## Database Module

```
modules/database/
  database.module.ts        # Exports PrismaService
  prisma.service.ts         # PrismaService extends PrismaClient, implements OnModuleInit
```

There is NO `src/prisma/` folder. Feature modules import `DatabaseModule` to inject `PrismaService`.

## Request Flow (MANDATORY)

```
Controller → Service → PrismaService → Database
```

FORBIDDEN: Controller→PrismaService ❌ | Controller→business logic ❌ | Service→HTTP logic ❌ | PrismaService→business logic ❌

## Layer Responsibilities

**Controllers**: HTTP transport only. Receive DTOs, call services, return responses. Use `@UseGuards()` for protection. Keep methods 1-5 lines. No business logic, no PrismaService access, no data transformation.

**Services**: ALL business logic. Orchestrate operations, enforce rules, handle errors via try/catch + NestJS exceptions. Use `Pick<>` for output typing + Prisma `select`. Error messages in pt-BR.

**PrismaService**: Data access only. Used ONLY inside services. No business logic.

**DTOs**: Input contracts. Validate with class-validator, document with `@nestjs/swagger`. Not used as output models.

## Development Rules

- Controllers thin, services focused and explicit
- Validate ALL input via DTOs
- Error messages in Portuguese (pt-BR)
- NEVER return sensitive fields (password, tokens) in responses
- NEVER bypass service layer or access DB in controllers
- Cross-module communication via injecting other module's service (never their PrismaService)

Any violation → STOP → Refactor before continuing.
