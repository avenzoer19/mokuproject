-- ============================================================
-- Moku for Research — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_url   text,
  institution  text,
  field        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. PAPERS ───────────────────────────────────────────────
create table if not exists public.papers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  authors         text,
  journal         text,
  year            int,
  doi             text,
  abstract        text,
  notes           text,
  citation_count  int default 0,
  is_bookmarked   boolean default false,
  pdf_url         text,
  pdf_path        text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 3. TAGS ─────────────────────────────────────────────────
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text default 'teal',
  created_at  timestamptz default now()
);

-- ── 4. PAPER_TAGS ────────────────────────────────────────────
create table if not exists public.paper_tags (
  id        uuid primary key default gen_random_uuid(),
  paper_id  uuid not null references public.papers(id) on delete cascade,
  tag_id    uuid not null references public.tags(id) on delete cascade,
  unique(paper_id, tag_id)
);

-- ── 5. ANNOTATIONS ──────────────────────────────────────────
create table if not exists public.annotations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  paper_id      uuid not null references public.papers(id) on delete cascade,
  type          text not null check (type in ('highlight','note','question')),
  selected_text text,
  content       text,
  color         text,
  page_number   int,
  position_x    float,
  position_y    float,
  created_at    timestamptz default now()
);

-- ── 6. MANUSCRIPTS ──────────────────────────────────────────
create table if not exists public.manuscripts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default 'Untitled Manuscript',
  content         text,
  status          text default 'draft' check (status in ('draft','review','submitted','published')),
  target_journal  text,
  word_count      int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 7. PROTOCOLS ────────────────────────────────────────────
create table if not exists public.protocols (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  status      text default 'draft' check (status in ('draft','active','completed','archived')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 8. PROTOCOL_STEPS ───────────────────────────────────────
create table if not exists public.protocol_steps (
  id           uuid primary key default gen_random_uuid(),
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  step_number  int not null,
  title        text not null,
  description  text,
  duration_min int,
  parameters   jsonb default '{}',
  status       text default 'draft' check (status in ('draft','running','done','caution')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── 9. LAB_LOGS ─────────────────────────────────────────────
create table if not exists public.lab_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid references public.protocols(id) on delete set null,
  step_title   text,
  parameter    text,
  expected     text,
  actual       text,
  delta        text,
  status       text default 'success' check (status in ('live','success','partial','fail')),
  operator     text,
  notes        text,
  logged_at    timestamptz default now()
);

-- ── 10. EXPERIMENTS ─────────────────────────────────────────
create table if not exists public.experiments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  type        text,
  status      text default 'running' check (status in ('running','completed','failed')),
  results     jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 11. SCREENING_SESSIONS ──────────────────────────────────
create table if not exists public.screening_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Screening Session',
  status        text default 'active' check (status in ('active','completed','paused')),
  total_papers  int default 0,
  done_count    int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── 12. SCREENING_CRITERIA ──────────────────────────────────
create table if not exists public.screening_criteria (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.screening_sessions(id) on delete cascade,
  type        text not null check (type in ('inclusion','exclusion')),
  text        text not null,
  created_at  timestamptz default now()
);

-- ── 13. SCREENING_DECISIONS ─────────────────────────────────
create table if not exists public.screening_decisions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  session_id      uuid not null references public.screening_sessions(id) on delete cascade,
  paper_id        uuid references public.papers(id) on delete set null,
  decision        text not null check (decision in ('include','exclude','maybe')),
  reviewer_notes  text,
  ai_reasoning    text,
  ai_confidence   int,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 14. DASHBOARD_STATS VIEW ────────────────────────────────
drop view if exists public.dashboard_stats;
create view public.dashboard_stats as
select
  u.id                                                          as user_id,
  count(distinct p.id)                                          as paper_count,
  count(distinct a.id)                                          as annotation_count,
  count(distinct m.id)                                          as manuscript_count,
  count(distinct pr.id) filter (where pr.status = 'active')    as active_protocols,
  count(distinct p2.id) filter (where p2.is_bookmarked = true) as bookmarked_count,
  count(distinct ss.id) filter (where ss.status = 'completed') as completed_screenings
from auth.users u
left join public.papers p          on p.user_id = u.id
left join public.annotations a     on a.user_id = u.id
left join public.manuscripts m     on m.user_id = u.id
left join public.protocols pr      on pr.user_id = u.id
left join public.papers p2         on p2.user_id = u.id
left join public.screening_sessions ss on ss.user_id = u.id
group by u.id;

-- ── 15. UPDATED_AT TRIGGER ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_updated_at_trigger(tbl text)
returns void language plpgsql as $$
begin
  execute format('
    drop trigger if exists set_updated_at on public.%I;
    create trigger set_updated_at
      before update on public.%I
      for each row execute procedure public.set_updated_at();
  ', tbl, tbl);
end;
$$;

select public.create_updated_at_trigger('papers');
select public.create_updated_at_trigger('manuscripts');
select public.create_updated_at_trigger('protocols');
select public.create_updated_at_trigger('protocol_steps');
select public.create_updated_at_trigger('profiles');
select public.create_updated_at_trigger('screening_sessions');

-- ── 16. ROW LEVEL SECURITY ──────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.papers             enable row level security;
alter table public.tags               enable row level security;
alter table public.paper_tags         enable row level security;
alter table public.annotations        enable row level security;
alter table public.manuscripts        enable row level security;
alter table public.protocols          enable row level security;
alter table public.protocol_steps     enable row level security;
alter table public.lab_logs           enable row level security;
alter table public.experiments        enable row level security;
alter table public.screening_sessions enable row level security;
alter table public.screening_criteria enable row level security;
alter table public.screening_decisions enable row level security;

-- profiles
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- papers
create policy "Users manage own papers" on public.papers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tags
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- paper_tags: allowed if user owns the paper
create policy "Users manage own paper_tags" on public.paper_tags for all
  using (exists (select 1 from public.papers where id = paper_id and user_id = auth.uid()))
  with check (exists (select 1 from public.papers where id = paper_id and user_id = auth.uid()));

-- annotations
create policy "Users manage own annotations" on public.annotations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- manuscripts
create policy "Users manage own manuscripts" on public.manuscripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- protocols
create policy "Users manage own protocols" on public.protocols for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- protocol_steps: allowed if user owns the protocol
create policy "Users manage own protocol_steps" on public.protocol_steps for all
  using (exists (select 1 from public.protocols where id = protocol_id and user_id = auth.uid()))
  with check (exists (select 1 from public.protocols where id = protocol_id and user_id = auth.uid()));

-- lab_logs
create policy "Users manage own lab_logs" on public.lab_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- experiments
create policy "Users manage own experiments" on public.experiments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- screening_sessions
create policy "Users manage own screening_sessions" on public.screening_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- screening_criteria: allowed if user owns the session
create policy "Users manage own screening_criteria" on public.screening_criteria for all
  using (exists (select 1 from public.screening_sessions where id = session_id and user_id = auth.uid()))
  with check (exists (select 1 from public.screening_sessions where id = session_id and user_id = auth.uid()));

-- screening_decisions
create policy "Users manage own screening_decisions" on public.screening_decisions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 17. STORAGE BUCKET FOR PDFs ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "Users upload own PDFs" on storage.objects for insert
  with check (bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read own PDFs" on storage.objects for select
  using (bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own PDFs" on storage.objects for delete
  using (bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1]);
