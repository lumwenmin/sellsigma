-- Each user has one config row with their subreddits + intent signals
create table user_configs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique not null references auth.users(id),
  subreddits     text[] not null default '{}',
  intent_signals text[] not null default '{}',
  updated_at     timestamptz default now()
);

-- flagged_posts: reddit_id alone is no longer unique —
-- the same post can be flagged for different users with different signals
alter table flagged_posts drop constraint flagged_posts_reddit_id_key;
alter table flagged_posts add constraint flagged_posts_reddit_id_user_id_key unique (reddit_id, user_id);
