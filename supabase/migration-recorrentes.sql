-- ============================================================
--  MIGRAÇÃO: transações recorrentes
--  Rode este arquivo no Supabase > SQL Editor > New query > Run
--  (necessário apenas em projetos criados antes desta versão;
--   instalações novas já ganham tudo pelo schema.sql)
-- ============================================================

-- Regras de lançamento automático (financiamento, assinatura, salário...)
create table if not exists public.recurring_rules (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  description  text not null,
  amount       numeric(12,2) not null,          -- negativo = gasto, positivo = receita
  category     text not null default 'outros',
  account      text,
  day_of_month int  not null default 1 check (day_of_month between 1 and 28),
  active       boolean not null default true,
  applied_until text,                            -- 'yyyy-mm' do último mês já lançado
  created_at   timestamptz not null default now()
);

alter table public.recurring_rules enable row level security;

drop policy if exists "own recurring" on public.recurring_rules;
create policy "own recurring" on public.recurring_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vincula transações geradas à regra de origem e impede lançamento
-- duplicado da mesma regra no mesmo dia (idempotência).
alter table public.transactions
  add column if not exists rule_id uuid references public.recurring_rules(id) on delete set null;

create unique index if not exists transactions_rule_date_uidx
  on public.transactions (rule_id, date);
