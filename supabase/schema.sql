-- ============================================
-- Apollo Polls - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- Tables
-- ============================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  avatar text not null default 'default',
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create table public.polls (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null check (category in ('Homework', 'Research', 'Else')),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_email text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  type text not null default 'multiple_choice' check (type in ('multiple_choice', 'free_response')),
  allow_other boolean not null default false,
  sort_order int not null default 0
);

create table public.question_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  sort_order int not null default 0
);

create table public.responses (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid references public.question_options(id) on delete cascade,
  free_text text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Prevent duplicate votes: one answer per question per user
  unique(question_id, user_id)
);

-- ============================================
-- Storage Bucket for poll assets
-- ============================================

insert into storage.buckets (id, name, public)
values ('poll-assets', 'poll-assets', true)
on conflict do nothing;

create policy "Anyone can view poll assets"
  on storage.objects for select
  using (bucket_id = 'poll-assets');

create policy "Authenticated users can upload poll assets"
  on storage.objects for insert
  with check (bucket_id = 'poll-assets' and auth.role() = 'authenticated');

create policy "Users can delete own poll assets"
  on storage.objects for delete
  using (bucket_id = 'poll-assets' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Indexes
-- ============================================

create index idx_questions_poll_id on public.questions(poll_id);
create index idx_options_question_id on public.question_options(question_id);
create index idx_responses_poll_id on public.responses(poll_id);
create index idx_responses_option_id on public.responses(option_id);
create index idx_responses_user_id on public.responses(user_id);
create index idx_polls_category on public.polls(category);
create index idx_polls_user_id on public.polls(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.polls enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.responses enable row level security;

-- Polls: anyone can read, only owner can insert/update/delete
create policy "Polls are viewable by everyone"
  on public.polls for select
  using (true);

create policy "Users can create polls"
  on public.polls for insert
  with check (auth.uid() = user_id);

create policy "Users can update own polls"
  on public.polls for update
  using (auth.uid() = user_id);

create policy "Users can delete own polls"
  on public.polls for delete
  using (auth.uid() = user_id);

-- Questions: anyone can read, only poll owner can manage
create policy "Questions are viewable by everyone"
  on public.questions for select
  using (true);

create policy "Poll owners can create questions"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_id and polls.user_id = auth.uid()
    )
  );

create policy "Poll owners can delete questions"
  on public.questions for delete
  using (
    exists (
      select 1 from public.polls
      where polls.id = poll_id and polls.user_id = auth.uid()
    )
  );

-- Question options: anyone can read, only poll owner can manage
create policy "Options are viewable by everyone"
  on public.question_options for select
  using (true);

create policy "Poll owners can create options"
  on public.question_options for insert
  with check (
    exists (
      select 1 from public.questions q
      join public.polls p on p.id = q.poll_id
      where q.id = question_id and p.user_id = auth.uid()
    )
  );

create policy "Poll owners can delete options"
  on public.question_options for delete
  using (
    exists (
      select 1 from public.questions q
      join public.polls p on p.id = q.poll_id
      where q.id = question_id and p.user_id = auth.uid()
    )
  );

-- Responses: users can read all (for results), can only insert their own
create policy "Responses are viewable by everyone"
  on public.responses for select
  using (true);

create policy "Users can submit responses"
  on public.responses for insert
  with check (auth.uid() = user_id);
