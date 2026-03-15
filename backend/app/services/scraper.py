import asyncpraw
import os
from datetime import datetime, timezone, timedelta
from typing import Any
from supabase import Client
from app.services.classifier import classify_post

LOOKBACK_HOURS = 24


async def scrape_for_user(
    reddit: asyncpraw.Reddit,
    supabase: Client,
    user_id: str,
    subreddits: list[str],
    intent_signals: list[str],
) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
    subreddit = await reddit.subreddit("+".join(subreddits))

    async for post in subreddit.new(limit=100):
        created = datetime.fromtimestamp(post.created_utc, tz=timezone.utc)
        if created < cutoff:
            break

        try:
            result = await classify_post(post.title, post.selftext, intent_signals)
        except Exception as e:
            print(f"[classifier] skipping post {post.id} for user {user_id}: {e}")
            continue

        if result["is_intent"]:
            try:
                supabase.table("flagged_posts").upsert(
                    {
                        "reddit_id": post.id,
                        "title": post.title,
                        "body": post.selftext,
                        "url": f"https://reddit.com{post.permalink}",
                        "subreddit": post.subreddit.display_name,
                        "score": result["score"],
                        "matched_signals": result["matched_signals"],
                        "created_at": created.isoformat(),
                        "user_id": user_id,
                    },
                    on_conflict="reddit_id,user_id",
                ).execute()
            except Exception as e:
                print(f"[supabase] failed to save post {post.id} for user {user_id}: {e}")


async def run_scraper(supabase: Client) -> None:
    print("[scraper] starting run")

    response = supabase.table("user_configs").select("*").execute()
    configs: list[Any] = response.data

    if not configs:
        print("[scraper] no user configs found, skipping")
        return

    reddit = asyncpraw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        user_agent=os.environ["REDDIT_USER_AGENT"],
    )

    async with reddit:
        for config in configs:
            user_id: str = config["user_id"]
            subreddits: list[str] = config["subreddits"]
            intent_signals: list[str] = config["intent_signals"]

            if not subreddits or not intent_signals:
                print(f"[scraper] skipping user {user_id}: no subreddits or signals configured")
                continue

            print(f"[scraper] running for user {user_id} — {len(subreddits)} subreddits, {len(intent_signals)} signals")
            await scrape_for_user(reddit, supabase, user_id, subreddits, intent_signals)

    print("[scraper] run complete")
