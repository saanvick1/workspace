# DebateForge

An AI-powered competitive debate training platform. Practice structured debates against an intelligent opponent, receive real-time argument analysis with scoring across logic, evidence, clarity, and persuasiveness, and track your improvement over time.

## Features

- **Multiple Debate Formats** — Oxford, Lincoln-Douglas, Parliamentary, and Public Forum
- **AI Opponent** — Debate against a GPT-powered adversary that adapts to your arguments
- **Real-Time Argument Analysis** — Each argument is scored on logic, evidence, clarity, and persuasiveness
- **Fallacy Detection** — Automatic identification of logical fallacies in your arguments
- **Practice Mode** — Standalone argument analyzer with counter-argument generation
- **Topic Generation** — Browse curated topics or generate new ones by category
- **Session History** — Review past debates with detailed scoring and feedback
- **User Statistics** — Track win rate, streaks, average scores, and progression
- **Dark Mode** — Full light/dark theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Routing | wouter |
| State | TanStack React Query v5 |
| Backend | Express 5, Node.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| AI | OpenAI API (GPT) |
| Forms | React Hook Form + Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key

### Installation

```bash
git clone https://github.com/saanvick1/DebateForge.git
cd DebateForge
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/debateforge
OPENAI_API_KEY=sk-your-openai-api-key
```

### Database Setup

```bash
npm run db:push
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui + custom)
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database interface + implementation
│   ├── openai.ts        # OpenAI integration
│   └── db.ts            # Database connection
├── shared/              # Shared TypeScript types
│   └── schema.ts        # Drizzle ORM schema + Zod validators
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topics` | List all debate topics |
| POST | `/api/topics` | Create a new topic |
| POST | `/api/topics/generate` | AI-generate a topic by category |
| POST | `/api/sessions` | Start a new debate session |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions/:id/argue` | Submit an argument |
| POST | `/api/sessions/:id/end` | End a debate session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/stats` | Get user statistics |
| POST | `/api/practice/analyze` | Analyze a standalone argument |
| POST | `/api/practice/counter` | Generate counter-arguments |

## License

MIT
