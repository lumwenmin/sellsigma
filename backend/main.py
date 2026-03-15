from contextlib import asynccontextmanager
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())  # must run before any app imports read env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.dependencies import supabase
from app.services.scraper import run_scraper
from app.routers import posts, config

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(run_scraper, "cron", hour=19, minute=0, args=[supabase])
    scheduler.start()
    print("[scheduler] started — scraper will run daily at 19:00 UTC")
    yield
    scheduler.shutdown()
    print("[scheduler] stopped")


app = FastAPI(title="SellSigma API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(posts.router)
app.include_router(config.router)
