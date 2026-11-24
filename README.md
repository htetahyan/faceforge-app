# FaceForge / GlowUp AI

FaceForge (GlowUp AI) is an Expo (React Native) mobile app with a Hono and TypeScript backend. The app generates AI portraits, handles billing through Stripe and RevenueCat, and sends push notifications.

## Repository layout

- `mobile/` — Expo app (portrait generation, account, paywall, notifications)
- `backend/` — Hono API, Postgres via Drizzle, generation queue, billing webhooks, and push
- `docker-compose.yml` — local Postgres for development

## Secrets

Never commit secrets. Real environment files and Firebase client configs stay on your machine:

- `backend/.env` and `backend/.env.production`
- `mobile/.env` and `mobile/.env.production`
- `mobile/google-services.json` and `GoogleService-Info.plist`

Those paths are listed in `.gitignore`. Commit only the `*.example` templates. Copy a template, then fill in your own keys. Refer to each setting by its variable name in docs and reviews.

## Backend setup

1. Copy the env template and fill in every value, including `DATABASE_URL`, `JWT_SECRET`, and `WEBHOOK_SECRET`.

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Install dependencies (from `backend/`):

   ```bash
   bun install
   ```

3. Start Postgres. Export `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` first, or put those names in a gitignored `.env` file next to `docker-compose.yml`. Use the same user, password, and database name in `DATABASE_URL`.

   ```bash
   docker compose up -d db
   ```

4. Apply the schema and start the API (from `backend/`):

   ```bash
   bun run db:push
   bun run dev
   ```

`DATABASE_URL`, `JWT_SECRET`, and `WEBHOOK_SECRET` are required. The API and Drizzle config do not fall back to a built-in database URL or secret.

For a production-style stack, copy `backend/.env.example` to `backend/.env.production`, set `DATABASE_URL` and `ALLOWED_ORIGIN`, and export `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` before:

```bash
docker compose -f backend/docker-compose.production.yml up -d --build
```

## Mobile setup

1. Copy the production env template and replace every placeholder:

   ```bash
   cp mobile/.env.production.example mobile/.env.production
   ```

   Use your own API origin, Google client IDs, RevenueCat keys, and privacy and terms URLs.

2. Firebase on Android reads `mobile/google-services.json`. That file is local-only. Copy the template and replace the placeholders with the config from the Firebase console:

   ```bash
   cp mobile/google-services.json.example mobile/google-services.json
   ```

3. Install dependencies and start Expo (from `mobile/`):

   ```bash
   bun install
   bun run start
   ```

## Where keys come from

Comments in `backend/.env.example` and `mobile/.env.production.example` name the console for each variable (Google AI Studio, Stripe, Cloudflare R2, Firebase, RevenueCat, Resend or SMTP, and Google Cloud OAuth). Create those credentials in the provider dashboards. Do not paste them into git.
