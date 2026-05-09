# PurSuit — tech stack plan

This document describes the **intended architecture** and **what is in the repo today**, so contributors and reviewers can align on direction.

## Overview

PurSuit is built around a **Supabase-backed backend** (PostgreSQL, Auth, Storage, Row Level Security) and a **TypeScript** client layer. The app code is structured to plug into an **Expo (React Native)** shell using `EXPO_PUBLIC_*` environment variables for the Supabase URL and anon key.

## Mobile app development (Expo / React Native)

The mobile client is **Expo** on **React Native** with **TypeScript**. This matches `src/lib/supabase.ts`, which reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Native dependencies are not yet listed in root `package.json`; add them when the Expo app is scaffolded (or in the app’s workspace package).

| Area | Choice / notes |
| --- | --- |
| Framework | **Expo** — managed workflow, single codebase for **iOS** and **Android** |
| UI runtime | **React Native** with the **New Architecture** when supported by your Expo SDK (default for new projects) |
| JS engine | **Hermes** (Expo default) — good startup and compatibility with common RN libraries |
| Language | **TypeScript** — align `tsconfig` / path aliases with shared `src/` if the app lives in-repo |
| Navigation | **Expo Router** (file-based routes under `app/`) is the typical default for new Expo apps; alternatively `@react-navigation/*` with a classic entry |
| Config | **`app.json` / `app.config.js` / `app.config.ts`** — use dynamic config if you need env at build time; `EXPO_PUBLIC_*` is inlined for client bundles |
| Dev workflow | **Expo CLI** (`npx expo start`) — dev builds via Expo Go for quick iteration, or a **development build** when you need custom native code or native modules unsupported in Expo Go |
| Production builds | **EAS Build** (Expo Application Services) for iOS/Android binaries; **EAS Submit** for App Store / Play Store; **EAS Update** optional for OTA JS/asset updates within policy limits |
| Secrets on device | Only **`EXPO_PUBLIC_*`** and similar are bundled into the app; treat them as public. **Service role keys never ship in the client.** RLS remains the enforcement layer |
| Supabase Auth (mobile) | Prefer configuring the JS client with **persistent storage** for sessions (e.g. **Async Storage** via `@react-native-async-storage/async-storage` and Supabase’s React Native auth options) so logins survive app restarts |
| OAuth / deep links | Configure **iOS URL schemes / associated domains** and **Android intent filters** in Expo config for redirect URIs used by Supabase Auth providers |
| Media | **Expo Image** (`expo-image`) or **React Native** `Image` for remote URLs from Supabase Storage; respect bucket policies and prefer signed URLs when policies require it |
| Native toolchains | **Xcode** (iOS Simulator / device), **Android Studio** (emulator / device) — required for local native debugging and store builds when not using only EAS cloud builds |

**Local verification:** run against **Supabase CLI** (`supabase start`) by pointing `EXPO_PUBLIC_SUPABASE_URL` at local API (e.g. `http://127.0.0.1:54321`) on a simulator/emulator, or use your hosted project URL on physical devices on the same network as appropriate.

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
| Mobile app | Scaffold **Expo** and wire env as documented in **Mobile app development** above; `SUPABASE_URL` / `SUPABASE_ANON_KEY` remain supported for scripts or non-Expo consumers |
| CI | Typecheck (`npm run typecheck`), optional Expo/EAS checks, and Supabase migration checks as the project grows |
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
- **Mobile parity** — test auth, storage URLs, and feed flows on both iOS and Android; emulator networking differs from physical devices (especially for local Supabase).

---

*Update this file when major dependencies or architecture choices change.*
