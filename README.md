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
  routes/          chats.js (history API), tutor.js (streaming AI endpoint)
  services/        ai.js, attachments.js, storage.js
  data/            runtime chat storage (gitignored)
public/            Static front end
  *.html, css/, js/
```

## API
| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/chats` | List / create chats |
| GET/DELETE | `/api/chats/:id` | Read / delete a chat |
| POST | `/api/tutor` | Send a message; replies as Server-Sent Events (`delta`, `done`, `error`) |

## Security
Never commit `.env`. Rotate any key that has been committed.

## License
MIT
