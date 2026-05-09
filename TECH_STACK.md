# PurSuit — Tech stack

## App

This repo ships an **Expo (React Native) SDK 54** client under **`mobile/`**, using **Expo Router** (`mobile/app/`). Supabase reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `mobile/.env` (see `mobile/.env.example`).

Run from repo root:

- `npm run mobile:start` — Expo dev server (or `npm start`).

Typecheck:

- `cd mobile && npx tsc --noEmit` (also `npm run mobile:typecheck` from root).

## Backend

**Supabase** — PostgreSQL, Auth, Storage, RLS — config and migrations live under **`supabase/`**.

**Feed vs careers:** `feed_posts` has **no** `trait_tags` column. Canonical **`trait_tags`** (JSONB trait weights) sit on **`careers`**; posts reference a career via **`feed_posts.career_title` → `careers.career_title`**. The app loads traits by embedding **`careers (...)`** in feed queries or fetching **`careers`** for matching.

## Older web scaffold

Previous generations of this project carried a TanStack Start / Vite app under `src/`; that tree has been removed in favor of the Expo client above.
