alter table flagged_posts
  add column user_id uuid not null references auth.users(id);

create index flagged_posts_user_id_idx on flagged_posts (user_id);
