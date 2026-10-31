# NachoAI 🧀

An AI learning assistant for Grades 1–12: chat with an AI tutor, take practice
quizzes, and track your progress. Available in English, Khmer and French.

## Features
- **AI Tutor** – streaming chat tuned to grade and subject, with file/image attachments (PDF, text, images) and saved chat history.
- **Practice Quiz** – topic quizzes with scoring.
- **Dashboard & Progress** – see strengths, weak areas and quiz history.
- **Multilingual UI** and light/dark theme.

## Getting started
Requires Node.js 20+ and a [Groq API key](https://console.groq.com/).

```bash
npm install
cp .env.example .env   # then set GROQ_API_KEY
npm start              # http://localhost:3000
```

Use `npm run dev` for auto-reload.

## Project structure
```
server/            Express app
  app.js           Express app (exported, no listener - used by index.js and tests)
  index.js         Starts the HTTP server and handles graceful shutdown
  routes/          chats.js (history API), tutor.js (streaming AI endpoint)
  services/        ai.js, attachments.js, storage.js
  data/            runtime chat storage (gitignored)
  test/            node:test smoke tests
public/            Static front end
  *.html, css/, js/
```

Quiz results, subject progress and weak-topic detection (Dashboard/Progress
pages) are tracked client-side in `localStorage` via `public/js/progress-store.js`
- there's no login system yet, so this data is per-browser, not per-account.

## API
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check (used by deploy platforms / Docker) |
| GET/POST | `/api/chats` | List / create chats |
| GET/DELETE | `/api/chats/:id` | Read / delete a chat |
| POST | `/api/tutor` | Send a message; replies as Server-Sent Events (`delta`, `done`, `error`) |

## Testing & linting
```bash
npm test     # node:test smoke tests against the Express app
npm run lint
```
CI (`.github/workflows/ci.yml`) runs `npm test` on every push and pull request.

## Deployment

**Any Node host (Render, Railway, Fly.io, a VPS, ...):**
```bash
npm ci --omit=dev
NODE_ENV=production GROQ_API_KEY=... PORT=3000 npm start
```
The app reads its port from `PORT` (most platforms set this for you) and
binds `trust proxy`, so it's safe to run behind a reverse proxy/load balancer.

**Docker:**
```bash
docker build -t nachoai .
docker run -p 3000:3000 -e GROQ_API_KEY=your-key nachoai
```
Chat history is stored at `server/data/chats.json` inside the container,
which is not persisted across restarts unless you mount a volume:
```bash
docker run -p 3000:3000 -e GROQ_API_KEY=your-key -v nachoai-data:/app/server/data nachoai
```

**Required environment variables in production:** `GROQ_API_KEY` (see
`.env.example` for the rest, all optional with sane defaults).

## Known limitations
- No authentication - `/api/chats` is a single shared history, and quiz
  progress lives in each visitor's browser only.
- Chat history is a flat JSON file, fine for one instance/demo use, not for
  horizontal scaling or multiple concurrent writers at real load.

## Security
Never commit `.env`. Rotate any key that has been committed.

## License
MIT
