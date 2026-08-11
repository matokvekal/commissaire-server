# Commissaire Server

Backend API for the Commissaire app and the Transmiter Android app. TypeScript, Express 5,
PostgreSQL/Prisma, Google + SMS sign-in. See [`PLAN.md`](./PLAN.md) for the original rewrite
rationale and [`SETUP.md`](./SETUP.md) for the full Google OAuth + Postgres setup runbook — this
README only covers day-to-day dev commands.

**Architecture in one sentence:** Google and SMS are identity *providers* that only answer "who is
this person" — after a successful provider check, the server issues its own short-lived
Commissaire access token + rotating refresh token, and every other route only ever accepts that
token, never a Google ID token or an OTP code.

## Requirements

- Node.js 24+
- PostgreSQL (only needed once you start hitting `/api/v1/auth/*` — `/health` and
  `/api/v1/auth/config` work without it)

## Setup

```bash
npm install
cp .env.example .env   # fill in real values, never commit .env
```

Then follow [`SETUP.md`](./SETUP.md) to create the Google OAuth client and Postgres database.

### Environment variables

| Variable                | Required        | Notes                                                                 |
| ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `PORT`                   | no               | Defaults to `5000`                                                       |
| `DATABASE_URL`           | no*              | Postgres connection string. *Required for any `/api/v1/auth/*` or `/api/v1/users/*` route to work. |
| `JWT_ACCESS_SECRET`      | yes in production | Min 32 chars. Insecure dev default used automatically outside production. Signs the access token only — refresh tokens are opaque random values, not JWTs, so there's no `JWT_REFRESH_SECRET`. |
| `JWT_ACCESS_EXPIRES_IN`  | no               | Defaults to `15m`.                                                       |
| `JWT_REFRESH_EXPIRES_IN` | no               | Defaults to `30d`. Controls session lifetime (`sessions.expires_at`).    |
| `GOOGLE_CLIENT_IDS`      | yes (if GOOGLE enabled) | Comma-separated OAuth client IDs accepted as token audience. See SETUP.md. |
| `SMS_PROVIDER`           | no               | `MOCK` (default, logs codes locally) or `TWILIO` (not implemented yet).  |
| `AUTH_PROVIDERS`         | no               | Comma-separated, defaults to `GOOGLE`. Controls both `GET /auth/config` and which providers' endpoints accept requests. |
| `CORS_ORIGINS`           | yes              | Comma-separated allowed browser origins for the web dashboard.           |
| `LOG_LEVEL`              | no               | Pino level, defaults to `info`.                                          |

Startup fails fast (`process.exit(1)`) on invalid config: unknown `AUTH_PROVIDERS` values, or
missing/short `JWT_*_SECRET` in production.

## Running

```bash
npm run dev          # tsx watch, hot reload
npm run build         # tsc -> dist/
npm start              # node dist/server.js (after build)
```

`GET /health` returns `{ "status": "ok" }` and never touches the database.

## Database

`prisma/schema.prisma` defines four tables: `users`, `auth_identities`, `sessions`,
`otp_challenges` — identity (Google/SMS/email+password) is deliberately kept off the `users` table
itself, see the schema comments. A migration is already committed at
`prisma/migrations/20260809164652_init/` (generated via `prisma migrate diff`, no live database
was needed to produce it). Once `DATABASE_URL` is set and Postgres is reachable:

```bash
npx prisma migrate deploy   # applies the committed migration as-is
npm run db:generate          # regenerate the Prisma client after any future schema change
```

Use `npm run db:migrate` (`prisma migrate dev`) instead of `migrate deploy` only when you're
actively changing `schema.prisma` yourself and want Prisma to generate a *new* migration.

## Auth flow

Google/SMS only establish identity; they are never accepted by any other route.

1. `GET /api/v1/auth/config` — public. Returns `{ "providers": ["GOOGLE", "SMS"] }` (whatever's
   enabled via `AUTH_PROVIDERS`). Clients call this before rendering the login screen and only
   show the returned methods.
2. `POST /api/v1/auth/google` — body `{ "idToken": "<google-id-token>" }`. Verifies the token once,
   finds-or-creates the user, returns `{ user, accessToken, refreshToken, requiresProfile }`.
3. `POST /api/v1/auth/sms/request` — body `{ "phone": "+15551234567" }` (E.164). Returns
   `{ challengeId }`; the code itself is only ever sent via the configured `SmsProvider`, never in
   the response.
4. `POST /api/v1/auth/sms/verify` — body `{ "challengeId", "code" }`. Same response shape as
   `/google` on success.
5. Every other route requires `Authorization: Bearer <accessToken>` (the Commissaire token from
   step 2/4, not a Google ID token). `requireAuth` middleware verifies it statelessly (signature +
   expiry only, no DB/network call) and sets `req.auth = { userId, role, sessionId }`.
6. `POST /api/v1/auth/refresh` — body `{ "refreshToken" }`. The refresh token is an opaque random
   value; the server only ever stores `sha256(refreshToken)` in `sessions.refresh_token_hash` and
   looks sessions up by that hash. A successful refresh rotates it in place (new token issued, old
   hash overwritten, so reusing an already-rotated token no longer matches any session and is
   rejected). Returns a fresh `{ accessToken, refreshToken }`.
7. `POST /api/v1/auth/logout` — requires an access token; revokes that session. The access token
   itself stays valid until its own short natural expiry (stateless verification tradeoff), but no
   further refresh is possible once revoked.
8. `POST /api/v1/auth/logout-all` — requires an access token; revokes every session belonging to
   that user (all devices).
9. `PATCH /api/v1/users/me` — requires an access token. Body: any of `firstName`, `lastName`,
   `nickname`, `emergencyPhone` (all optional; `emergencyPhone` is never required for
   `requiresProfile` to resolve `false` — the other three are).
10. A provider disabled via `AUTH_PROVIDERS` rejects its endpoints with
   `403 { "error": "AUTH_PROVIDER_DISABLED" }` rather than 404 — the implementation stays in place,
   only exposure/acceptance is toggled.

New users always get `role: "RIDER"`; there's no client-controlled path to `COMMISSAIRE` — promote
a user by editing the database directly until a real admin flow exists. A disabled account
(`users.is_active = false`) is rejected at sign-in and at refresh time.

## Testing and quality

```bash
npm test         # vitest — Google/SMS calls and Prisma are mocked, no live network/DB needed
npm run typecheck
npm run lint
```

Tests cover: Google sign-in (new user, duplicate identity, invalid token, unverified email),
SMS OTP (happy path, wrong code, attempt lockout, expiry, resend cooldown), refresh rotation and
reuse rejection, deactivated-user refresh, multi-session isolation, logout and logout-all
revocation, tampered/expired tokens, the `AUTH_PROVIDERS` enable/disable behavior, and profile
completion.

## Deploying

CI (`.github/workflows/node.js.yml`) runs on a self-hosted runner on push to `staging`: installs
deps, generates the Prisma client, builds, and restarts the process under PM2 as `api`.

Manual access to the box:

```bash
ssh -i "C:\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com
```

The runtime `.env` lives at `/home/ubuntu/env/.env` on the host; CI symlinks it into the project
directory on each deploy. Reverse proxy is nginx with Let's Encrypt (see DigitalOcean's Ubuntu
nginx/Let's Encrypt guide for the general steps used originally).

## What changed from the old backend

This replaces the legacy Kids/Parents product (MySQL/Sequelize, MongoDB, Socket.IO, local JWT, SMS
OTP with a hardcoded bypass code). That code is preserved at the git tag `legacy-koali-backup` if
anything needs to be recovered. `serviceAccountKey.json`, which was previously committed, is no
longer used at all — auth verifies Google ID tokens directly instead of going through Firebase
Admin. **That credential should still be rotated/revoked in Google Cloud Console**, since it was
exposed in git history.
