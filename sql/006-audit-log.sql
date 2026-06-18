-- Auditoría institucional (lineamientos DIIT: quién/cuándo creó y modificó)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text
);

create index if not exists idx_audit_log_table_record on public.audit_log (table_name, record_id);
create index if not exists idx_audit_log_changed_at on public.audit_log (changed_at desc);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_action text;
  v_record_id text;
begin
  v_user := auth.uid();
  v_action := tg_op;
  v_record_id := coalesce(
    (to_jsonb(case when tg_op = 'DELETE' then old else new end)->>'id'),
    'unknown'
  );

  insert into public.audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  values (
    tg_table_name,
    v_record_id,
    v_action,
    v_user,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_solicitudes on public.solicitudes;
create trigger trg_audit_solicitudes
after insert or update or delete on public.solicitudes
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_account_requests on public.account_requests;
create trigger trg_audit_account_requests
after insert or update or delete on public.account_requests
for each row execute procedure public.audit_row_change();
