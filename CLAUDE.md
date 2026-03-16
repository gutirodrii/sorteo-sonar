# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # Production build
pnpm typecheck    # Type-check (react-router typegen + tsc)
```

There are no tests. There is no linter configured.

## Environment

Copy `.env.example` to `.env`. The only variable is:

```
API_BASE_URL=http://ec2-35-180-8-87.eu-west-3.compute.amazonaws.com
# API_BASE_URL=http://localhost:8000
```

`vite.config.ts` exposes env vars with `envPrefix: ["VITE_", "API_"]`, so `API_BASE_URL` is available as `import.meta.env.API_BASE_URL` in client code.

## Architecture

This is a **React Router v7 SPA** (SSR enabled but effectively single-route) that runs a behavioural experiment: participants enter a wristband code, roll a virtual dice, and report their result.

### Single-route state machine

The entire app lives at `/`. `app/routes/home.tsx` renders `<Welcome>` (`app/welcome/welcome.tsx`), which is a client-side state machine over these screens in order:

```
welcome → code → success → instructions → game → report → exit
                                ↑ state 0
               ↳ game (if state 1 — already rolled, not reported)
               ↳ exit  (if state 2 — already completed)
```

There is no URL-based navigation between screens.

### API integration (`app/utils/api.ts`)

All backend calls go to a FastAPI backend. The key contract:

- **`POST /users/`** — registers a new user by `pulsera_id` (wristband code). Returns a `User` object with an **integer `id`** that must be stored and used for all subsequent calls. Throws `UserNotFoundError` if the pulsera doesn't exist, `PulseraAlreadyRegisteredError` if already taken.
- **`GET /users/{user_id}/state`** — returns a **bare integer** (`0`, `1`, or `2`), not `{ state: N }`. The wrapper function normalises this.
- **`POST /users/{user_id}/throw`** — rolls the dice server-side; returns `{ id, user_id, value, throw_time }`.
- **`POST /users/{user_id}/claim-first`** — submits the participant's reported value; returns `{ id, user_id, true_value, claimed_value }` (no `is_honest` field).
- All `user_id` path params are **integers**, never the pulsera string.

### Session state (`app/utils/SessionContext.tsx`)

A React Context wraps the entire app (`app/root.tsx`). Persisted to `localStorage` as `ss_session` (telemetry excluded). Key fields:

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `number \| null` | Integer PK from the database |
| `pulseraId` | `string \| null` | Wristband code (for display and session recovery) |
| `userState` | `0 \| 1 \| 2 \| null` | Synced from API |
| `firstValidRoll` | `number \| null` | First dice result |
| `tickets` | `number` | Computed from `firstValidRoll` |

`verifyUser(pulseraId)` handles the full registration/recovery flow: tries `createUser`, and if the pulsera is already registered it looks up the integer `userId` from the stored `localStorage` session to recover the existing state.

### Screen tracking

When `userId` is set, screen transitions automatically call `POST /users/{user_id}/screens` with `"screen1"` (welcome/code/success), `"screen2"` (instructions/game), or `"screen3"` (report/exit). Deduplication prevents repeated calls for the same API screen group.
