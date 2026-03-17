create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  company text not null,
  address text,
  total_billed numeric not null default 0,
  pending_amount numeric not null default 0,
  invoice_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_engagements (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_id text not null,
  client_name text not null,
  amount numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  status text not null check (status in ('paid', 'pending', 'overdue')),
  due_date timestamptz not null,
  created_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb
);

create table if not exists public.compliance_records (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  period text not null,
  amount numeric not null default 0,
  status text not null check (status in ('pending', 'filed', 'paid')),
  due_date timestamptz not null,
  filed_date timestamptz,
  paid_date timestamptz
);

alter table public.clients enable row level security;
alter table public.audit_engagements enable row level security;
alter table public.compliance_records enable row level security;

create policy "clients_select_own"
on public.clients
for select
using (auth.uid() = owner_id);

create policy "clients_insert_own"
on public.clients
for insert
with check (auth.uid() = owner_id);

create policy "clients_update_own"
on public.clients
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "clients_delete_own"
on public.clients
for delete
using (auth.uid() = owner_id);

create policy "engagements_select_own"
on public.audit_engagements
for select
using (auth.uid() = owner_id);

create policy "engagements_insert_own"
on public.audit_engagements
for insert
with check (auth.uid() = owner_id);

create policy "engagements_update_own"
on public.audit_engagements
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "engagements_delete_own"
on public.audit_engagements
for delete
using (auth.uid() = owner_id);

create policy "compliance_select_own"
on public.compliance_records
for select
using (auth.uid() = owner_id);

create policy "compliance_insert_own"
on public.compliance_records
for insert
with check (auth.uid() = owner_id);

create policy "compliance_update_own"
on public.compliance_records
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "compliance_delete_own"
on public.compliance_records
for delete
using (auth.uid() = owner_id);

alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.audit_engagements;
alter publication supabase_realtime add table public.compliance_records;
