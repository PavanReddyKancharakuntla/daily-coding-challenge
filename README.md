# Daily Coding Challenge Generator — Backend

FastAPI + PostgreSQL backend for a daily coding challenge platform.
Auth, daily challenge endpoint, submissions with sandboxed code execution,
streaks, scoring, and a leaderboard.

## Stack
- FastAPI 0.115 / Uvicorn
- SQLAlchemy 2.0 / PostgreSQL (SQLite for tests)
- JWT auth with bcrypt password hashing
- Anthropic Claude API for LLM-generated challenges (optional)
- Judge0 for multi-language code execution (optional; local Python fallback included)

## Quick start

```bash
# 1. Install deps
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# edit .env — set DATABASE_URL, SECRET_KEY, optionally ANTHROPIC_API_KEY and JUDGE0_*

# 3. Seed the challenge bank
python -m app.seed.seed_db

# 4. Run
uvicorn app.main:app --reload
# -> http://localhost:8000/docs
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/health`              | no  | Liveness check |
| POST | `/auth/signup`         | no  | Create account, returns JWT |
| POST | `/auth/login`          | no  | Email + password, returns JWT |
| GET  | `/me`                  | yes | Current user profile |
| GET  | `/me/submissions`      | yes | Recent submissions |
| GET  | `/challenges/today`    | no  | Today's challenge for `?difficulty=easy\|medium\|hard` |
| GET  | `/challenges/{slug}`   | no  | Lookup by slug |
| POST | `/challenges/generate` | yes | LLM-generated practice challenge |
| POST | `/submissions`         | yes | Submit code, runs against test cases |
| GET  | `/leaderboard`         | no  | Top users by `?by=score\|streak` |

## How the hybrid generator works

`get_or_create_daily_challenge` runs on every `GET /challenges/today`:

1. If a `DailyChallenge` row already exists for `(today, difficulty)`, return it.
2. Otherwise pick a random *unused* challenge from the seeded bank and pin it.
3. If the bank has no active challenge for that difficulty at all, call the
   Anthropic API to synthesise one (with test cases) and pin that.

`POST /challenges/generate` always goes through the LLM — useful for practice
or a custom topic. If `ANTHROPIC_API_KEY` is unset the generator returns a
deterministic offline stub so dev/tests still work.

## How code execution works

`app/services/code_executor.py`:

- If `JUDGE0_API_KEY` is set → submits each test case to Judge0 (base64,
  `wait=true`) and inspects status IDs (3 = accepted, 4 = WA, 5 = TLE,
  6 = compile error, 7+ = runtime error).
- Else if language is `python` → runs the code locally with `subprocess`,
  5-second timeout. Strictly a dev fallback.
- Else → returns an error result asking the operator to configure Judge0.

## Streaks & scoring

Defined in `app/services/streak_service.py`:

- Easy = 10 pts, Medium = 25, Hard = 50.
- First accepted submission of the calendar day adds points + a streak bonus
  of `min(current_streak, 25)`.
- Solving on consecutive calendar days grows the streak. A skipped day
  resets it to 1 on the next solve.
- Same-day repeats don't double-count.

## Testing

```bash
pytest -q
```

Tests use an in-memory SQLite DB and the local Python executor — no Postgres
or Judge0 required.

## Project layout

```
app/
  main.py              FastAPI app + lifespan (creates tables)
  config.py            pydantic-settings, reads .env
  database.py          SQLAlchemy engine, SessionLocal, Base
  core/
    security.py        bcrypt + JWT helpers
    deps.py            get_current_user dependency
  models/              SQLAlchemy ORM models
  schemas/             Pydantic request/response models
  services/
    challenge_generator.py   seed + LLM hybrid
    code_executor.py         Judge0 / local Python
    streak_service.py        scoring & streak logic
  api/                 Route modules wired in main.py
  seed/
    challenges.json    Curated starter bank
    seed_db.py         python -m app.seed.seed_db
tests/
  test_smoke.py        End-to-end + unit checks
```

## Production notes

- Replace `Base.metadata.create_all` with Alembic migrations before shipping.
- Tighten `CORSMiddleware` allowed origins in `app/main.py`.
- Move JWT secret + DB URL to a real secret manager.
- For LLM-generated challenges, validate output against a JSON schema before
  persisting (the parser already strips fences and parses JSON).
- Add rate limiting on `/auth/login`, `/submissions`, and `/challenges/generate`.
