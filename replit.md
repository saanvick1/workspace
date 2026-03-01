# DebateForge — replit.md

## Overview

DebateForge is an AI-powered debate practice platform. Users can browse or generate debate topics, start structured debate sessions against an AI opponent, and receive detailed argument analysis and feedback. The app supports multiple debate formats (Oxford, Lincoln-Douglas, Parliamentary, Public Forum) and tracks session history and user statistics.

Key features:
- Browse, generate (by genre), or create custom debate topics — with duplicate prevention
- Suggested topics bar for quick-adding popular debate motions
- Real-time debate sessions with AI opponent (powered by OpenAI)
- Per-argument analysis: logic, evidence, clarity, persuasiveness scores, and fallacy detection
- Practice mode for standalone argument analysis and counter-argument generation
- Session history with scoring and feedback
- User stats tracking (win rate, streaks, etc.)
- Light/dark theme toggle, persisted in localStorage

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a single repository with three top-level directories:
- `client/` — React frontend (Vite)
- `server/` — Express backend (Node.js / TypeScript)
- `shared/` — Shared TypeScript types and Drizzle schema used by both client and server

Path aliases:
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State / Data Fetching**: TanStack React Query v5 for server state; local `useState` for UI state
- **UI Components**: shadcn/ui (New York style) built on top of Radix UI primitives
- **Styling**: Tailwind CSS v3 with CSS custom properties for theming (light + dark mode via `.dark` class)
- **Forms**: React Hook Form + Zod resolvers
- **Font**: Google Fonts (DM Sans, Fira Code, Geist Mono, Architects Daughter)

Pages:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Dashboard` | Stats overview + quick actions |
| `/topics` | `Topics` | Browse, filter, and start debates |
| `/debate/:id` | `Debate` | Live debate session UI |
| `/history` | `History` | Past session list with scores |
| `/practice` | `Practice` | Standalone argument analyzer |

### Backend Architecture
- **Framework**: Express 5 (Node.js) with TypeScript, run via `tsx` in dev
- **Entry point**: `server/index.ts` → registers routes → serves static files or Vite dev middleware
- **API**: REST, all routes under `/api/*`
- **Storage layer**: `server/storage.ts` defines `IStorage` interface; `DatabaseStorage` class implements it using Drizzle ORM
- **AI integration**: `server/openai.ts` wraps OpenAI SDK calls for argument generation, analysis, feedback, topic generation, and counter-argument generation
- **Build**: Custom `script/build.ts` — runs Vite for client, then esbuild for server (bundles selected deps for faster cold starts)

### Shared Schema (`shared/schema.ts`)
Drizzle ORM schema for PostgreSQL with these tables:
- `users` — UUID primary key, username, password
- `debate_topics` — title, category, difficulty, description, tags array
- `debate_sessions` — links to topic, format, positions, status, round tracking, score, feedback
- `debate_messages` — per-session messages with role and phase
- `argument_analyses` — per-message scores (logic, evidence, clarity, persuasiveness, overall), fallacies, suggestions
- `user_stats` — aggregate stats (total debates, wins, streak, avg score, etc.)

Additional shared models in `shared/models/chat.ts`:
- `conversations` and `messages` tables (used by Replit integration chat/audio routes)

### Replit Integrations (modular, under `server/replit_integrations/`)
Pre-built integration modules that can be enabled independently:
- **chat** — Conversation + message management with OpenAI chat completions
- **audio** — Voice recording (client), audio format detection/conversion (ffmpeg), speech-to-text, TTS streaming via SSE
- **image** — Image generation and editing via `gpt-image-1`
- **batch** — Generic batch processor with `p-limit` concurrency control and `p-retry` exponential backoff

Client-side audio utilities live in `client/replit_integrations/audio/`:
- `useVoiceRecorder` — MediaRecorder hook (WebM/Opus)
- `useAudioPlayback` — AudioWorklet-based PCM16 streaming playback with sequence reordering
- `useVoiceStream` — SSE consumer for voice responses

### Authentication
- Schema has a `users` table with username/password
- Session infrastructure (`connect-pg-simple`, `express-session`, `passport`, `passport-local`) is listed as a dependency but auth routes are not yet wired in the visible route code — the app currently operates without enforced auth

### Theme System
- CSS custom properties defined in `client/src/index.css` for both `:root` (light) and `.dark` selector
- `ThemeProvider` component reads/writes `localStorage` key `debate-theme` and toggles `dark` class on `<html>`
- Tailwind configured with `darkMode: ["class"]`

## External Dependencies

### AI / OpenAI
- **Package**: `openai` SDK
- **Models used**: `gpt-5.2` for debate argument generation; standard chat completions for analysis/feedback/topic generation; `gpt-image-1` for image generation
- **Environment variables**:
  - `AI_INTEGRATIONS_OPENAI_API_KEY` — API key (used by both main app and Replit integration modules)
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` — Base URL override (Replit AI proxy)

### Database
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) with `drizzle-zod` for schema-derived Zod validators
- **Connection**: `pg` Pool via `DATABASE_URL` environment variable
- **Migrations**: Drizzle Kit (`drizzle-kit push` for schema sync; migrations output to `./migrations/`)
- **Session store**: `connect-pg-simple` (PostgreSQL-backed Express sessions)

### Key npm Packages
| Package | Purpose |
|---------|---------|
| `express` v5 | HTTP server |
| `wouter` | Client-side routing |
| `@tanstack/react-query` v5 | Server state management |
| `drizzle-orm` + `drizzle-zod` | ORM + schema validation |
| `zod` | Runtime validation |
| `react-hook-form` + `@hookform/resolvers` | Form handling |
| `radix-ui/*` | Accessible UI primitives |
| `tailwind-merge` + `clsx` + `class-variance-authority` | Tailwind class utilities |
| `date-fns` | Date formatting |
| `nanoid` | ID generation |
| `p-limit` + `p-retry` | Batch concurrency/retry |
| `multer` | File upload (audio) |
| `nodemailer` | Email (listed in build allowlist, not yet wired) |
| `stripe` | Payments (listed in build allowlist, not yet wired) |
| `ws` | WebSockets (listed in build allowlist) |
| `xlsx` | Spreadsheet export (listed in build allowlist) |

### Replit-specific Vite Plugins (dev only)
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay
- `@replit/vite-plugin-cartographer` — Code map tool
- `@replit/vite-plugin-dev-banner` — Dev environment banner

### Environment Variables Required
```
DATABASE_URL        # PostgreSQL connection string (required at startup)
AI_INTEGRATIONS_OPENAI_API_KEY   # OpenAI API key
AI_INTEGRATIONS_OPENAI_BASE_URL  # OpenAI base URL (Replit proxy)
```