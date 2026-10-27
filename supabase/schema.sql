-- FlowForge schema. Run this file in the Supabase SQL Editor as the project owner.
create extension if not exists pgcrypto;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text check (description is null or char_length(description) <= 2000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_owner_matches_project check (owner_id is not null)
);

create index projects_owner_updated_idx on public.projects (owner_id, updated_at desc);
create index tasks_project_created_idx on public.tasks (project_id, created_at);
create index tasks_owner_due_idx on public.tasks (owner_id, due_date) where due_date is not null;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end; $$;
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

-- Ensure a task cannot be created under another user's project, even if its owner_id is forged.
create or replace function public.enforce_task_owner() returns trigger language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.projects where id = new.project_id and owner_id = auth.uid()) then
    raise exception 'Tasks must belong to one of your projects';
  end if;
  new.owner_id := auth.uid();
  return new;
end; $$;
create trigger tasks_enforce_owner before insert or update on public.tasks for each row execute function public.enforce_task_owner();

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "Users manage their own projects" on public.projects
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users manage tasks in their own projects" on public.tasks
  for all to authenticated
  using (owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
