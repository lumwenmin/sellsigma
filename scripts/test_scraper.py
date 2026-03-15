"""
One-off test script for the classifier + Supabase write.
Uses fake Reddit posts instead of live Reddit API.
Fetches real user configs from DB so it mirrors the actual scraper.
Run from the scraper/ directory: python test_scraper.py
"""
import sys
import os
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Any
from supabase import create_client
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())  # must run before importing classifier (client is created at import time)

# Import classifier from backend/app
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from app.services.classifier import classify_post

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

FAKE_POSTS = [
    {
        "id": "test_001",
        "title": "We're drowning in manual spreadsheets for sales tracking — is there a better way?",
        "body": "Our team of 5 spends hours every week updating Excel sheets to track leads. We've looked at Salesforce but it's way too expensive for us. Anyone found a good lightweight alternative?",
        "subreddit": "startups",
        "url": "https://reddit.com/r/startups/test_001",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "test_002",
        "title": "Just hit 1 million users on our app — here's what we learned",
        "body": "It's been a wild ride. We started in a garage two years ago and now we have a full team. Happy to answer any questions about scaling.",
        "subreddit": "entrepreneur",
        "url": "https://reddit.com/r/entrepreneur/test_002",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]


async def run():
    configs: list[Any] = supabase.table("user_configs").select("*").execute().data or []

    if not configs:
        print("No user configs found. Add subreddits and signals via the dashboard first.")
        return

    for config in configs:
        user_id = config["user_id"]
        intent_signals = config["intent_signals"]

        if not intent_signals:
            print(f"[test] skipping user {user_id}: no intent signals configured")
            continue

        print(f"\n=== Testing for user {user_id} ===")
        print(f"Signals: {intent_signals}")

        for post in FAKE_POSTS:
            print(f"\n--- Post: {post['id']} ---")
            print(f"Title: {post['title']}")

            try:
                result = await classify_post(post["title"], post["body"], intent_signals)
            except Exception as e:
                print(f"[classifier] failed: {e}")
                continue

            print(f"Result: is_intent={result['is_intent']}, score={result['score']}")
            print(f"Matched: {result['matched_signals']}")

            if result["is_intent"]:
                print("-> Flagged. Saving to Supabase...")
                try:
                    supabase.table("flagged_posts").upsert(
                        {
                            "reddit_id": post["id"],
                            "title": post["title"],
                            "body": post["body"],
                            "url": post["url"],
                            "subreddit": post["subreddit"],
                            "score": result["score"],
                            "matched_signals": result["matched_signals"],
                            "created_at": post["created_at"],
                            "user_id": user_id,
                        },
                        on_conflict="reddit_id,user_id",
                    ).execute()
                    print("-> Saved.")
                except Exception as e:
                    print(f"[supabase] failed to save: {e}")
            else:
                print("-> Not flagged. Skipping.")


asyncio.run(run())
