---
globs: server/**
---

# Authentication, Guards & Security Rules

## Auth Strategy

JWT-based, stateless. Token in HTTP-only cookies. NO passport/passport-jwt.

## Auth Flow

```
POST /auth/login
  → AuthController receives SignInDto
  → AuthService.signIn(email, password)
      → UserService.findByEmailWithPassword(email)
      → HashService.comparePassword(plain, hash)
      → if invalid → throw UnauthorizedException('E-mail ou senha inválidos')
      → jwtService.signAsync({ sub: user.id, name: user.name })
      → return { access_token }
  → res.cookie('access_token', access_token, cookieConfig)
  → return { message: 'Sign In successful' }

POST /auth/logout
  → res.clearCookie('access_token', cookieConfig)
  → return { message: 'Logged out' }
```

## Module Responsibilities

**AuthService**: validate credentials (email+password), generate JWT via `jwtService.signAsync()`, return `{ access_token }`. Does NOT set cookies.

**AuthController**: receives `SignInDto`, calls `authService.signIn()`, sets/clears cookie via `@Res({ passthrough: true })`, returns `{ message }`.

**HashService** (`common/hash/`): `hashPassword(plain)` and `comparePassword(plain, hash)` via bcrypt. Used by `UserService` (create/update) and `AuthService` (login). NEVER implement bcrypt directly in services.

## JWT Payload (minimal)

```typescript
const payload = { sub: user.id, name: user.name }
```

NEVER include sensitive data (password, email, roles) in JWT.

## Cookie Config (MANDATORY)

Import from `src/common/config/cookie.config.ts`:

```typescript
export const cookieConfig: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict',
  maxAge: 1000 * 60 * 60 * 24, // 1 day
}
```

Always use `cookieConfig` for both `res.cookie()` and `res.clearCookie()`. Use `@Res({ passthrough: true })` — NEVER `@Res()` alone. NEVER hardcode cookie options. NEVER store tokens in localStorage or response body.

---

## Guards

Location: `src/common/guards/auth/`

### BaseJwtGuard (abstract)

Shared JWT verification logic. `AuthGuard` and `OptionalAuthGuard` extend this.

```typescript
protected verifyToken(token: string): Promise<RequestTokenPayload> {
  return this.jwtService.verifyAsync(token, {
    secret: this.configService.get<string>('JWT_SECRET'),
  })
}
```

### AuthGuard (requires authentication)

Reads `access_token` from cookies. Throws `UnauthorizedException` if missing/expired/invalid. Sets `request.user = { sub, name }`.

### OptionalAuthGuard (optional authentication)

Never throws. Sets `request.user = null` if no token or invalid. Use for routes that work for both authenticated and unauthenticated users.

### OwnershipGuard (resource ownership)

Compares `request.user.sub` with `request.params.id`. Throws `ForbiddenException` if mismatch. MUST always be used WITH `AuthGuard`:

```typescript
@UseGuards(AuthGuard, OwnershipGuard)  // correct order
```

### Usage

```typescript
@UseGuards(AuthGuard)                    // authenticated only
@UseGuards(OptionalAuthGuard)            // optional auth
@UseGuards(AuthGuard, OwnershipGuard)    // authenticated + owner
```

Request types from `src/common/types/req-types`: `AuthenticatedRequest` (user guaranteed), `OptionalAuthRequest` (user may be null).

Feature modules import `AuthGuardModule` to use guards.

### Guard Rules

- NEVER implement auth logic manually in controllers/services
- NEVER create new JWT guards from scratch — extend `BaseJwtGuard`
- NEVER use `OwnershipGuard` without `AuthGuard`
- NEVER duplicate guard logic

---

## Security Rules

### Password

- Hash with `HashService.hashPassword()` before saving. Compare with `HashService.comparePassword()`. Strong bcrypt salt
- NEVER store/log plain passwords

### Input

- Validate ALL inputs via DTOs with `whitelist: true`, `forbidNonWhitelisted: true`
- NEVER trust client input, NEVER allow unknown fields

### Database

- Prisma prevents SQL injection. Always exclude sensitive fields via `select`
- NEVER expose internal data structures

### API

- Use guards for protected routes. Restrict access properly
- Protect sensitive endpoints (login, auth) with rate limiting

### Logging

- Log important actions (auth, errors). NEVER log sensitive data

### Must Prevent

XSS, injection attacks, broken auth flows, data leaks, insecure storage.

Principle of least privilege — grant only necessary access.

Security is NON-NEGOTIABLE. Any risk → STOP → Refactor immediately.
