# Omnia AI

Turn a text idea or document into a whiteboard-style cartoon explainer video.

## Local development

```bash
docker compose up -d
# Create .env with DATABASE_URL, REDIS_URL, SESSION_SECRET (32+ random chars),
# APP_URL, and STUB_MODE=true. Add ADMIN_EMAIL and ADMIN_PASSWORD to seed the admin.
npm ci
npm run db:migrate
npm run db:seed
npm run dev        # web app at http://localhost:3000
# In another terminal:
npm run worker     # background video jobs
```

The local Compose MongoDB is an unauthenticated, single-node replica set for development only. It is bound to localhost. Do not expose it or use it in production.

### Alternative without Docker

Use MongoDB Atlas (replica set) and a Redis TCP service that supports BullMQ blocking commands. Put their connection strings in `DATABASE_URL` and `REDIS_URL`.

## Current feature status

Set `STUB_MODE=true` in `.env`. The app runs without provider API keys, and the worker renders a short demo MP4 with FFmpeg. LLM and TTS integrations are not implemented yet; generation currently uses placeholder scenes and silent audio. With `STUB_MODE=false`, the health check and worker refuse to run rather than silently pretending to use live providers.

Email reminders currently log to the console. `RESEND_API_KEY` is not used.

## Tests

```bash
npm test                 # unit tests
npm run test:integration # integration (needs running MongoDB + Redis)
npm run smoke            # smoke test against a running server
```

## Payments

Manual bank transfer only. No Paystack, cards, or webhooks.

1. User selects a plan → server creates a pending payment with unique reference `OMN-XXXXX`.
2. Checkout shows bank details from admin settings, amount, and reference. Copy tells the user to include the reference in the transfer narration.
3. User uploads receipt (max 5 MB). Status stays pending; message: “Payment under review, usually within 24 hours.”
4. Admin reviews the queue, approves (must enter amount received; note required if it differs) or rejects (reason required).
5. Approval activates the plan immediately, sets `current_period_end` to 30 days (or extends existing), writes audit log.
6. No automatic renewal. Reminders go out 3 days and 1 day before expiry (console in stub mode).
7. On expiry the subscription becomes expired and the user returns to Free limits; videos are kept.
8. User can cancel reminders in Account settings.
9. Admin can mark an approved payment as refunded (immediate downgrade + audit log).
10. Admin can export approved payments as CSV for any date range.

| Plan     | Daily | Max length | Watermark | Price (NGN) |
|----------|-------|------------|-----------|-------------|
| Free     | 5     | 4 min      | Yes       | 0           |
| Starter  | 15    | 7 min      | No        | 5000        |
| Pro      | 40    | 12 min     | No        | 12000       |
| Business | 100   | 17 min     | No        | 30000       |

Admin can edit plans and bank details in the admin panel.

## Deployment

The web app is a Next.js 15 App Router project. Deploy the web app and the long-running worker as separate services. The worker must have FFmpeg installed; serverless platforms cannot run it.

### Required production configuration

| Service       | Recommended              | Notes                                      |
|---------------|--------------------------|--------------------------------------------|
| MongoDB       | MongoDB Atlas            | Use a replica-set connection string        |
| Redis         | Render Key Value or Redis TCP provider | Must support BullMQ blocking commands; REST-only Redis endpoints are not suitable |
| Object storage| Cloudflare R2            | Set all four `S3_*` variables              |
| Worker host   | Render / Railway / Fly   | Run `npm run worker`; install FFmpeg       |

Set these variables on **both** the web and worker services:

- `DATABASE_URL`: MongoDB replica-set URL
- `REDIS_URL`: Redis TCP connection URL
- `SESSION_SECRET`: random secret, at least 32 characters
- `APP_URL`: public HTTPS URL of the web service
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: persistent S3-compatible storage
- `STUB_MODE=true`: required until real LLM/TTS integrations are implemented

Set `NODE_ENV=production` on both services. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are only needed while seeding the administrator. Keep real credentials in the host's environment settings or an ignored local `.env` file; never commit them.

After the first deploy, run the schema push once and seed the admin/plans:

```bash
npx prisma db push
npm run db:seed
```

`npm run db:seed` requires `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters. Add them temporarily to the service environment or provide them in the provider's one-off shell, run the seed, then remove the password from the service environment.

### Render

The included [render.yaml](./render.yaml) creates a Docker web service and a separate background worker. Both use [Dockerfile](./Dockerfile), which installs FFmpeg and builds the app. The Blueprint prompts for shared environment-group values when you create the services.

Before deploying, create a MongoDB Atlas replica set and an S3-compatible bucket. Use a Render Key Value service or another Redis TCP endpoint that supports BullMQ. Set `APP_URL` to the web service's public HTTPS URL. Keep the database, Redis, web, and worker in compatible regions and allow the services to reach MongoDB/Redis.

The web service health-checks `/api/health`. Schema changes are intentionally not run automatically during deploy; run the schema push and seed commands above from a service shell after the first deploy.

### Vercel or Netlify

Set the project root to the directory containing `package.json`. Use `npm ci` and `npm run build`; set the production variables listed above. These platforms host only the web service—the worker must still run separately on Render, Railway, Fly.io, or another long-running host with FFmpeg.

Local filesystem storage is for development only. Production requires all four `S3_*` variables because host filesystems are ephemeral.
