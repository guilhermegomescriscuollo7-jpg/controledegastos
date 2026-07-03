-- ============================================================
--  Controle de Gastos - schema do Supabase
--  Cole tudo isto em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Extensao para gerar UUIDs
create extension if not exists "pgcrypto";

-- ---------- TRANSACOES ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  description text not null,
  amount      numeric(12,2) not null,        -- negativo = gasto, positivo = receita
  category    text not null default 'outros',
  source      text not null default 'manual', -- manual | csv | pluggy
  account     text,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- ---------- ORCAMENTOS (limites por categoria) ----------
create table if not exists public.budgets (
  user_id       uuid not null references auth.users(id) on delete cascade,
  category      text not null,
  monthly_limit numeric(12,2) not null default 0,
  primary key (user_id, category)
);

-- ---------- META DE ECONOMIA MENSAL ----------
create table if not exists public.monthly_goals (
  user_id        uuid not null references auth.users(id) on delete cascade,
  month          text not null,               -- 'yyyy-mm'
  savings_target numeric(12,2) not null default 0,
  primary key (user_id, month)
);

-- ---------- PERFIL (salario mensal fixo) ----------
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  monthly_salary numeric(12,2) not null default 0,
  updated_at     timestamptz not null default now()
);

-- ============================================================
--  SEGURANCA: Row Level Security (cada um so ve o que e seu)
-- ============================================================
alter table public.transactions  enable row level security;
alter table public.budgets        enable row level security;
alter table public.monthly_goals  enable row level security;
alter table public.profiles       enable row level security;

-- transactions
drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- budgets
drop policy if exists "own budgets" on public.budgets;
create policy "own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- monthly_goals
drop policy if exists "own goals" on public.monthly_goals;
create policy "own goals" on public.monthly_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- profiles
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
