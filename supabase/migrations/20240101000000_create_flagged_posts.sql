create table if not exists flagged_posts (
  id               uuid primary key default gen_random_uuid(),
  reddit_id        text unique not null,
  title            text not null,
  body             text,
  url              text not null,
  subreddit        text not null,
  score            float,
  matched_signals  text[],
  is_read          boolean default false,
  is_dismissed     boolean default false,
  created_at       timestamptz not null,
  flagged_at       timestamptz default now()
);

-- Index for common dashboard query patterns
create index if not exists flagged_posts_flagged_at_idx on flagged_posts (flagged_at desc);
create index if not exists flagged_posts_is_read_idx on flagged_posts (is_read);
create index if not exists flagged_posts_is_dismissed_idx on flagged_posts (is_dismissed);
