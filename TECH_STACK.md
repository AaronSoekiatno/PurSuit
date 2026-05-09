# PurSuit — tech stack plan

This document describes the **intended architecture** and **what is in the repo today**, so contributors and reviewers can align on direction.

## Overview

PurSuit is built around a **Supabase-backed backend** (PostgreSQL, Auth, Storage, Row Level Security) and a **TypeScript** client layer. The app code is structured to plug into an **Expo (React Native)** shell using `EXPO_PUBLIC_*` environment variables for the Supabase URL and anon key.

## Current (in repo)

| Layer | Choice |
| --- | --- |
| Language | **TypeScript** (strict mode, ES modules) |
| Backend | **Supabase** — `@supabase/supabase-js` with generated `Database` types |
| Database | **PostgreSQL** (local stack targets **Postgres 17** per `supabase/config.toml`) |
| API surface | Supabase **PostgREST** for tables/views; **Auth** session persistence enabled in the client |
| Media | **Supabase Storage** (e.g. `feed-media` bucket; see `src/lib/supabase.ts`) |
| Data access | Typed queries from `src/lib/` (e.g. published feed from `feed_posts`) |
| Local development | **Supabase CLI** — `supabase/config.toml`, migrations, seed |

## Planned / next

| Layer | Direction |
| --- | --- |
| Mobile app | **Expo** — use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the client; `SUPABASE_URL` / `SUPABASE_ANON_KEY` remain supported for non-Expo or server-side contexts |
| CI | Typecheck (`npm run typecheck`) and optional Supabase migration checks as the project grows |
| Types | Keep `Database` (and related types) in sync with schema via Supabase type generation workflows |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public; enforce access with RLS) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Fallbacks for scripts or non-Expo consumers |

Do not commit secrets; use `.env` locally and GitHub Actions secrets for automation.

## Principles

- **RLS first** — anon key in the client is safe only when policies match product rules.
- **Typed client** — prefer `createClient<Database>()` and table-specific types over untyped queries.
- **Migrations** — schema changes flow through `supabase/migrations` (and local CLI), not ad-hoc production edits.

---

*Update this file when major dependencies or architecture choices change.*
