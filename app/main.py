import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError

from app.api import auth, challenges, leaderboard, submissions, users
from app.config import get_settings
from app.database import Base, SessionLocal, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


def _wait_for_db(max_attempts: int = 10, delay_seconds: float = 1.5) -> None:
    """Wait for the database to be reachable."""
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("DB reachable (attempt %d).", attempt)
            return
        except OperationalError as exc:
            logger.warning(
                "DB not ready (attempt %d/%d): %s", attempt, max_attempts, exc
            )
            if attempt == max_attempts:
                raise
            time.sleep(delay_seconds)


def _seed_if_empty() -> None:
    """If the challenges table is empty, run the seed script. Idempotent."""
    from app.models.challenge import Challenge
    from app.seed import seed_db

    with SessionLocal() as db:
        first = db.scalar(select(Challenge).limit(1))
        if first is not None:
            logger.info("Challenges already seeded, skipping.")
            return

    logger.info("Empty challenges table — running seed.")
    seed_db.run()
    logger.info("Seed complete.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: ensure DB is reachable, schema exists, and seed data is loaded.
    Errors here are LOGGED but do not crash the app — that way /health and
    the manual /admin/seed endpoint stay reachable for debugging."""
    try:
        _wait_for_db()
        Base.metadata.create_all(bind=engine)
        _seed_if_empty()
    except Exception:
        logger.exception("Startup hook failed; app will keep running.")
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS: comma-separated list in CORS_ORIGINS env var, or "*" by default.
_origins = [o.strip() for o in (settings.cors_origins or "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/me", tags=["me"])
app.include_router(challenges.router, prefix="/challenges", tags=["challenges"])
app.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "app": settings.app_name}


@app.post("/admin/seed", tags=["admin"])
@app.get("/admin/seed", tags=["admin"])
def admin_seed(key: str = Query(..., description="Must equal SECRET_KEY")):
    """Manually trigger the schema creation + seed.

    Hit this from your browser when the lifespan startup didn't seed
    successfully (e.g. if Railway's container started before Postgres was
    reachable). Pass `?key=<your SECRET_KEY>` so randos can't reset your DB.
    """
    if key != settings.secret_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        Base.metadata.create_all(bind=engine)
        from app.seed import seed_db

        seed_db.run()
        return {"status": "ok", "message": "Tables created and seed data loaded."}
    except Exception as exc:
        logger.exception("Manual seed failed")
        raise HTTPException(status_code=500, detail=str(exc))
