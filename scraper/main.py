import asyncpraw
import asyncio
import os
from datetime import datetime, timezone, timedelta
from supabase import create_client
from classifier import classify_post
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

SUBREDDITS = ["startups", "entrepreneur", "SaaS"]   # pulled from DB per user in future
LOOKBACK_HOURS = 24

async def run():
    reddit = asyncpraw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        user_agent=os.environ["REDDIT_USER_AGENT"],
    )

    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)

    async with reddit:
        subreddit = await reddit.subreddit("+".join(SUBREDDITS))
        async for post in subreddit.new(limit=100):
            created = datetime.fromtimestamp(post.created_utc, tz=timezone.utc)
            if created < cutoff:
                break
            result = await classify_post(post.title, post.selftext)
            if result["is_intent"]:
                supabase.table("flagged_posts").upsert({
                    "reddit_id": post.id,
                    "title": post.title,
                    "body": post.selftext,
                    "url": f"https://reddit.com{post.permalink}",
                    "subreddit": post.subreddit.display_name,
                    "score": result["score"],
                    "matched_signals": result["matched_signals"],
                    "created_at": created.isoformat(),
                }).execute()

asyncio.run(run())
