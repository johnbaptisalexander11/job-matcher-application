# Job Matcher Application

An AI-powered web app that compares a CV with a job description and tells you:

- **Match score** (0–100) from an AI recruiter, plus a **keyword (ATS) score** that shows how an automatic CV filter might rank you
- **Matched and missing skills**, with missing skills split into *required* and *nice to have*
- **Strengths and gaps**, written for this specific job
- **Improved CV bullets** rewritten to target the job (without inventing experience)
- **Likely interview questions** with tips
- **A learning plan** for the most important missing skills

It also works **offline with no API key**, using a built-in keyword engine.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| AI | Claude API (`@anthropic-ai/sdk`) with structured JSON output validated by Zod |
| Database | MongoDB with Mongoose (optional; falls back to in-memory history) |
| PDF parsing | pdf-parse |
| Tests | Node.js built-in test runner |

## How it works

```
React UI ──► POST /api/extract   (PDF ──► text)
         └─► POST /api/analyze
                 ├─ Local engine  : skill dictionary + required/nice-to-have detection
                 │                  + word-overlap (cosine) similarity ──► keyword score
                 └─ AI engine     : Claude reads the CV and job like a recruiter and returns
                                    JSON matching a Zod schema ──► fit score, rewrites, questions
             Result saved to MongoDB (or memory) ──► GET /api/history
```

**Local engine** (`server/engine/local.js`): finds about 90 known skills in both texts using word-boundary regexes (so `Java` is not confused with `JavaScript`, and `C#` / `C++` / `Node.js` match correctly). It treats a skill as *nice to have* when it is under a "Nice to have" heading or on a line with words like "preferred" or "a plus". Related skills count too: MySQL counts as SQL, Express counts as Node.js. Score = 75% weighted skill coverage + 25% text similarity.

**AI engine** (`server/engine/ai.js`): sends the CV and the job description to Claude with a recruiter system prompt and a Zod output schema, so the response is always valid, typed JSON. The prompt tells the model never to invent experience, and to use `[X%]`-style placeholders where a real number is needed. If the AI call fails, the app shows the offline analysis with a warning instead of an error.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Without an API key it runs in offline keyword mode.

**To turn on AI:** copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY` (from https://console.anthropic.com), and restart.

**Production build** (one server on port 5000 that serves both the API and the React app):

```bash
npm run build
```

```bash
npm start
```

**Tests:**

```bash
npm test
```

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | | `{ ok, aiEnabled }` |
| POST | `/api/extract` | form-data `cv` (PDF, max 5 MB) | `{ text }` |
| POST | `/api/analyze` | `{ cvText, jobText, mode: "auto" \| "local" }` | `{ id, result, warning? }` |
| GET | `/api/history` | | list of past analyses |
| GET | `/api/history/:id` | | one analysis with full result |

## Project structure

```
client/                React frontend (Vite root)
  src/App.jsx          inputs, upload, analyse button
  src/components/      Results (score rings, chips, rewrites) and History
server/
  index.js             Express API
  db.js                MongoDB / in-memory history
  engine/local.js      offline keyword matching engine
  engine/skills.js     skill dictionary with aliases and related skills
  engine/ai.js         Claude analysis with a Zod schema
  test/                unit tests for the local engine
```

## Ideas for next steps

- Paste a job URL and fetch the description automatically
- Generate a tailored cover letter from the analysis
- Track several applications and compare scores over time
- Use embeddings for semantic skill matching (e.g. "REST" ≈ "web services")
- Add login (JWT) so each user has their own history
