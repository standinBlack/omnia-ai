# Omnia AI

Turn a text idea or document into a whiteboard-style cartoon explainer video.

## Local development

```bash
docker compose up -d
cp .env.example .env
# Edit .env: set SESSION_SECRET (32+ chars), ADMIN_PASSWORD (12+ chars)
# For quick start without paid keys, set STUB_MODE=true
npm install
npx prisma db push
npm run db:seed
npm run dev        # web app at http://localhost:3000
# In another terminal:
npm run worker     # background video jobs
```

### Alternative without Docker

Use MongoDB Atlas and Upstash (Redis). Put their connection strings in `DATABASE_URL` and `REDIS_URL`.

## Stub mode

Set `STUB_MODE=true` in `.env`. The app runs without LLM, TTS, or email keys. The renderer still produces a real short MP4 via FFmpeg. Email logs to console.

When `STUB_MODE` is not `"true"`, the app checks required provider variables at startup and refuses to start if any are missing.

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

## Deployment notes

The web app is a standard Next.js 15 App Router project and deploys cleanly to **Vercel** or **Netlify**.  
The **worker** (`npm run worker`) is a long-running process that needs FFmpeg and must be hosted separately (Railway, Render, Fly.io, a VPS, etc.). Serverless platforms cannot run the video renderer.

### Shared production requirements

| Service       | Recommended              | Notes                                      |
|---------------|--------------------------|--------------------------------------------|
| MongoDB       | MongoDB Atlas            | Use a connection string with auth          |
| Redis         | Upstash Redis            | For BullMQ + rate limiting                 |
| Object storage| Cloudflare R2            | Set all `S3_*` variables (required in prod)|
| Worker host   | Railway / Render / Fly   | Must have FFmpeg installed                 |

Set every variable from `.env.example` in the host’s environment settings.  
Run the schema push once after the first deploy:

```bash
npx prisma db push
npm run db:seed   # only the first time, or when you want to re-seed plans
```

### Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Framework preset: **Next.js** (auto-detected).
4. Add all environment variables (especially `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `S3_*`, `APP_URL`).
5. Deploy. Vercel runs `npm install` (which triggers `prisma generate`) and `next build`.

### Deploy to Netlify

1. Push the repo to GitHub.
2. Create a new site from Git in Netlify.
3. Build settings (or rely on `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add the same environment variables.
5. Deploy. The included `netlify.toml` and `@netlify/plugin-nextjs` handle the Next.js runtime.

### Worker (required for video generation)

Deploy the same codebase to a long-running Node host and run:

```bash
npm run worker
```

The worker shares the same `DATABASE_URL` and `REDIS_URL` so it can process jobs enqueued by the web app. Install FFmpeg on that host.

### Local filesystem storage

`LOCAL_STORAGE_DIR` only works in development. In production always set the `S3_*` variables so uploads and rendered videos are stored in R2 (or any S3-compatible service).
