# PurSuit

**PurSuit** is short-form **career discovery** with **grounded AI**: a vertical video-style feed where engagement shapes a **trait profile** and **career recommendations**, and an **Ask AI chatbot** answers in context (including **what is on screen**) instead of generic chat.

It's an end-to-end slice of modern product work — **Expo / React Native** client, **Supabase** data and **Edge Functions**, and **Anthropic Claude** behind a deliberate **prompt + JSON grounding + optional vision** contract — with clear **privacy boundaries** (API keys on the server; session-scoped engagement signals).

---

## Table of contents

- [Title and brief overview](#pursuit)
- [Features](#features)
- [Technologies used](#technologies-used)
- [How to install and run](#how-to-install-and-run)
  - [Prerequisites](#prerequisites)
  - [Clone and install](#clone-and-install)
  - [Environment variables](#environment-variables)
  - [Supabase Edge Function (Ask AI)](#supabase-edge-function-ask-ai)
  - [Start the app](#start-the-app)
- [Usage instructions](#usage-instructions)
- [Key learning challenges](#key-learning-challenges)

---

## Features

- **Vertical feed (For You / Following)** — Full-screen career posts with **video** or **carousel** slides, tap-to-pause, double-tap-to-like, and a right-hand **action rail** (like, save, share UI, Ask AI).
- **Ask AI (Claude)** — Modal chat grounded on **where** the user opened it: current **feed post** (with optional **vision** from captured frames), **career detail**, or **session wrapped** stats. In-app disclaimer: exploration only, not professional advice.
- **Session-based signals → trait vector** — Views, likes, saves, skips, rewatches, and Ask AI usage update an in-memory profile used for **career fit** (cosine similarity vs. `trait_tags` on careers in Supabase).
- **Profile** — “You should pursue…” recommendation, **trait radar** (SVG spider chart from top trait axes), saved careers / saved videos tabs.
- **Career detail** — Deep link from feed (`/career/[id]`); loads from local fixtures or **Supabase** when needed.
- **Search** — Browse careers without relying on the feed order.
- **Session Wrapped** — Summary screen (`/wrapped`) of top careers and depth signals; can open Ask AI with wrapped grounding.
- **Settings** — Session-only analytics copy, **clear session analytics**, playback/language placeholders.

---

## Technologies used

| Layer | Stack |
|--------|--------|
| **Mobile app** | [Expo](https://expo.dev/) SDK **54**, [React Native](https://reactnative.dev/) **0.81**, [React](https://react.dev/) **19**, [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| **State & data** | [TanStack Query](https://tanstack.com/query) (server/cache), [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction) |
| **UI & motion** | [Reanimated](https://docs.swmansion.com/react-native-reanimated/), [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/), [expo-video](https://docs.expo.dev/versions/latest/sdk/video/), [expo-image](https://docs.expo.dev/versions/latest/sdk/image/), [react-native-svg](https://github.com/software-mansion/react-native-svg), [react-native-markdown-display](https://github.com/iamacup/react-native-markdown-display) |
| **Backend** | [Supabase](https://supabase.com/) (Postgres, Auth, Storage — see `supabase/`) |
| **AI** | [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) via **Deno** [Edge Function](https://supabase.com/docs/guides/functions) `pursuit-chat` (default model `claude-sonnet-4-6`, configurable with `CLAUDE_MODEL` secret) |
| **Tooling** | TypeScript, Prettier, Supabase CLI (`supabase` as dev dependency at repo root) |

---

## How to install and run

### Prerequisites

- **Node.js** LTS (v18+ recommended) and **npm**
- **Git**
- For physical devices: **Expo Go** app, or **Xcode** (iOS Simulator) / **Android Studio** (emulator)
- For **Ask AI**: a [Supabase](https://supabase.com/) project with the **`pursuit-chat`** function deployed and **`ANTHROPIC_API_KEY`** set (keys must not live in the mobile app)

### Clone and install

```bash
git clone <your-repo-url>
cd PurSuit
npm install
cd mobile && npm install && cd ..
```

### Environment variables

1. Copy the example env file for the mobile app:

   ```bash
   cp mobile/.env.example mobile/.env
   ```

2. Edit `mobile/.env` and set:

   - `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL  
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — your project’s anon (public) key  

   **Do not** put `ANTHROPIC_API_KEY` in `mobile/.env`; the Edge Function reads it from Supabase secrets.

### Supabase Edge Function (Ask AI)

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) logged in and linked to your project):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional:
supabase secrets set CLAUDE_MODEL=claude-sonnet-4-6

npm run deploy:pursuit-chat
# equivalent: supabase functions deploy pursuit-chat
```

Apply database migrations if you use a fresh project:

```bash
supabase db push
```

(Adjust to your team’s workflow; migrations live under `supabase/migrations/`.)

### Start the app

From **repository root**:

```bash
npm run mobile:start
```

Or from `mobile/`:

```bash
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

**Typecheck:**

```bash
npm run mobile:typecheck
```

---

## Usage instructions

1. **Open the app** — Land on **Home**. Use **For You** / **Following** tabs at the top.
2. **Scroll the feed** — Swipe vertically between posts. **Tap** the video to pause/play; **double-tap** to like.
3. **Save & engage** — Use the **bookmark** on the rail to save; likes/saves/watches feed the **session trait model** used on Profile.
4. **Ask AI** — Tap the **zap** button on the rail while a post is visible. Ask about the career, the visuals, or next steps. Read the header disclaimer.
5. **Profile** — Bottom tab **Profile** shows recommended career and **trait radar** after enough engagement; explore **Saved Careers** / **Saved Videos**.
6. **Career pill** — Tap the **💼 career** chip on a post to open the **career detail** screen.
7. **Search** — Use search from the app navigation to find careers by name.
8. **Settings (gear on Profile)** — Read **session-only analytics**; use **Clear session analytics** to reset in-memory engagement for demos or privacy.

---

## Key learning challenges

- **Grounded LLM calls** — Designing a single chat UX that switches **system context** (feed vs. career vs. wrapped JSON) without leaking the wrong snapshot or letting the model pretend it “saw” a frame when vision was disabled for non-feed modes.
- **Vision pipeline** — Capturing frames from **expo-video** / carousels, size limits, and fetching or encoding images for the Edge Function while keeping latency acceptable on mobile networks.
- **Feed UX at 60fps-adjacent** — Coordinating **Reanimated**, **Gesture Handler**, and a **FlatList**-style vertical feed with overlays (seek bar, rail, bottom bar) without breaking scroll or focus.
- **Session-only inference** — Storing engagement **in memory** for privacy and simplicity while still driving a responsive **React Query**–backed profile and radar; invalidating caches when signals clear.
- **Production-shaped mobile security** — Keeping **Anthropic** keys only on the server, using the **anon** key for client → Supabase function calls, and surfacing **non-2xx** errors clearly in the chat sheet (`fetch` to `functions/v1/pursuit-chat` instead of opaque client errors).
