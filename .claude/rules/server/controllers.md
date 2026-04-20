---
globs: server/**
---

# Controllers & DTOs Rules

## Controller Location

`modules/<feature>/<feature>.controller.ts` — flat file at module root, NOT in `controllers/` subfolder.

## Controller Pattern

Each method: receive DTO → call service → return response. Max 1-5 lines.

```typescript
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto)
  }

  @UseGuards(AuthGuard, OwnershipGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id)
  }

  @UseGuards(AuthGuard, OwnershipGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto)
  }

  @UseGuards(AuthGuard, OwnershipGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}
```

## Controller Rules

- Use DTOs for ALL inputs via `@Body()`, `@Param()`, `@Query()`
- Use `@UseGuards()` for protected routes
- Use `@Req()` only to read `req.user` (set by guards) — never parse tokens manually
- RESTful naming: `create`, `findAll`, `findOne`, `update`, `remove` (or semantic: `findMe`, `signIn`, `logout`)
- FORBIDDEN: business logic, PrismaService access, complex data transformation, manual validation

## Cookie Handling (Auth Routes Only)

Use `@Res({ passthrough: true })` — `passthrough: true` is mandatory (keeps NestJS interceptors working):

```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.signIn(dto.email, dto.password)
  res.cookie('access_token', result.access_token, cookieConfig)
  return { message: 'Sign In successful' }
}
```

Import `cookieConfig` from `src/common/config/cookie.config`. NEVER hardcode cookie options.

## Guard Usage

```typescript
@UseGuards(AuthGuard)                    // requires authenticated user
@UseGuards(OptionalAuthGuard)            // works with or without auth
@UseGuards(AuthGuard, OwnershipGuard)    // authenticated + resource owner
```

Access user: `@Req() req: AuthenticatedRequest` or `OptionalAuthRequest` (from `src/common/types/req-types`).

---

# DTOs

## Location

`modules/<feature>/dto/create-<feature>.dto.ts`, `update-<feature>.dto.ts`

## Validation (MANDATORY)

Every field MUST have both class-validator AND `@nestjs/swagger` decorators. `@IsNotEmpty()` always combined with type validator.

### Create DTO

```typescript
import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'user@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string
}
```

### Update DTO (all optional)

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: 'new@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string
}
```

## DTO Naming

`CreateUserDto`, `UpdateUserDto`, `SignInDto`, `PaginationDto` — NEVER generic names like `UserData`, `Payload`.

## Global Validation Pipe (MANDATORY)

`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — no manual validation in controllers/services.

## DTO Rules

- No business logic in DTOs. DTOs are NOT output models
- Always include `example` in `@ApiProperty`/`@ApiPropertyOptional`
- Common validators: `@IsString`, `@IsEmail`, `@IsNumber`, `@IsBoolean`, `@IsNotEmpty`, `@IsOptional`, `@MinLength`, `@MaxLength`
