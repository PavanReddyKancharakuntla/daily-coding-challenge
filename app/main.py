from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, challenges, leaderboard, submissions, users
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (use Alembic in production).
    Base.metadata.create_all(bind=engine)
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
