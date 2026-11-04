# Applux

**The professional AI platform for builders.**

Applux lets users register, connect their infrastructure (GitHub, Vercel, Cloudflare, Resend), and work with two AI models:

| Model | Provider | Role |
|---|---|---|
| **Septo 1.8** | Mistral API (`mistral-large-latest`) | Builder — architects and builds full-stack products |
| **Septo 1.6** | Google Gemini API (`gemini-2.0-flash`) | Assistant — chat, analysis, planning |

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — sharp "gridiron" design system
- **Prisma + PostgreSQL**
- **JWT auth** (httpOnly cookies, bcrypt password hashing)
- **GitHub OAuth** connector + API-token connectors for Vercel, Cloudflare, Resend

## Quick start

```bash
git clone https://github.com/dennybadmam/applux.git
cd applux
npm install
cp .env.example .env        # fill in your keys
npm run db:generate
npm run db:push             # create tables
npm run dev
```

Open http://localhost:3000

## Environment

| Variable | Purpose |
|---|---|
| `MISTRAL_API_KEY` | Septo 1.8 — get one at console.mistral.ai |
| `GEMINI_API_KEY` | Septo 1.6 — get one at aistudio.google.com |
| `JWT_SECRET` | Long random string for session signing |
| `DATABASE_URL` | Postgres connection string (Neon / Supabase / Railway) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional — enables one-click GitHub OAuth |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Public client id for the OAuth button |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on [vercel.com/new](https://vercel.com/new).
3. Add all environment variables in Project Settings.
4. Run `npx prisma db push` against your production database once.
5. Deploy.

## Roadmap

- [ ] Streaming responses
- [ ] Septo 1.8 executes directly on connected GitHub repos (create repos, branches, commits, PRs)
- [ ] Vercel deploy actions from chat
- [ ] Cloudflare DNS management
- [ ] Resend email templates

---

© Applux. Built with Septo.
