---
globs: server/**
---

# Services, Errors & Prisma Rules

## Service Location

`modules/<feature>/<feature>.service.ts` — flat file at module root, NOT in `services/` subfolder.

## Output Typing (inline Pick — no entity files)

```typescript
import { User } from '@prisma/client'

type UserPublic = Pick<User, 'id' | 'name' | 'email'>
```

Define `type XPublic = Pick<X, ...>` at top of service file. Use Prisma `select` to match. NEVER return full records with sensitive fields.

## Service Method Pattern

```typescript
async methodName(input): Promise<OutputType> {
  // 1. Prepare data (e.g. hash password)
  // 2. Prisma operation (wrapped in try/catch)
  // 3. Business logic (check results, compare values)
  // 4. Handle edge cases (throw NestJS exceptions)
  // 5. Return typed result
}
```

## Complete Example

```typescript
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma, User } from '@prisma/client'
import { CreateUserDto } from './dto/create-user.dto'

type UserPublic = Pick<User, 'id' | 'name' | 'email'>

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<UserPublic> {
    const hashedPassword = await this.hashService.hashPassword(data.password)
    try {
      return await this.prisma.user.create({
        data: { name: data.name, email: data.email, password: hashedPassword },
        select: { id: true, name: true, email: true },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado')
      }
      throw new InternalServerErrorException('Erro ao criar usuário')
    }
  }

  async findOne(id: string): Promise<UserPublic> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      })
      if (!user) throw new NotFoundException('Usuário não encontrado')
      return user
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Erro ao buscar usuário')
    }
  }
}
```

## Error Handling (MANDATORY)

All Prisma operations wrapped in `try/catch`. Handle specific Prisma codes, then fall back to `InternalServerErrorException`.

### Rethrow Pattern (MANDATORY)

NestJS exceptions thrown inside `try` MUST be rethrown in `catch`:

```typescript
} catch (error) {
  if (error instanceof NotFoundException) throw error
  if (error instanceof UnauthorizedException) throw error
  throw new InternalServerErrorException('Erro ao buscar usuário')
}
```

### Prisma Error Codes

| Code | Meaning | Exception |
|------|---------|-----------|
| `P2002` | Unique constraint violation | `ConflictException` |
| `P2025` | Record not found (update/delete) | `NotFoundException` |

### Standard NestJS Exceptions

`NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`, `InternalServerErrorException`

### Error Messages — Portuguese (pt-BR) ONLY

```typescript
throw new NotFoundException('Usuário não encontrado')        // ✅
throw new ConflictException('E-mail já cadastrado')          // ✅
throw new UnauthorizedException('Email ou senha inválidos')  // ✅
throw new NotFoundException('User not found')                // ❌
```

Messages must be clear, human-readable, specific. NEVER expose internal details (SQL, stack traces, Prisma messages).

## Error Flow

```
Service throws NestJS exception → AllExceptionsFilter (global) → Structured response to client
```

## Prisma Rules

### Location

`modules/database/prisma.service.ts` — NO `src/prisma/` folder.

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect() }
}
```

`DatabaseModule` exports `PrismaService`. Feature modules import `DatabaseModule`.

### Query Rules

- Always use `select` to limit returned fields — NEVER return password/tokens
- Use `include` intentionally and sparingly
- Use `prisma.$transaction()` for multi-step atomic operations
- Keep queries simple and readable

### Access Rules

- Inject via constructor: `constructor(private readonly prisma: PrismaService) {}`
- Used ONLY inside services — NEVER in controllers
- Don't expose PrismaService across modules (use the module's service)
- Don't access another module's PrismaService directly

## Service Rules

- Naming: `create`, `findOne`, `findByEmailWithPassword`, `update`, `remove` — never vague names
- Cross-module: inject other services (e.g. `AuthService` injects `UserService`, `HashService`)
- Max ~50-80 lines per method. Split if larger
- FORBIDDEN: HTTP concepts (req/res), unrelated responsibilities, `services/` subfolder, error messages in English
