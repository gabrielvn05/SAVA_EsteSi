-- Rol docente en app_role (solicitudes de cuenta y perfiles)
do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'app_role' and e.enumlabel = 'docente'
    ) then
      alter type app_role add value 'docente';
    end if;
  end if;
end $$;

-- Capacidades por defecto: docente igual que administrativo
create or replace function public.seed_default_capabilities(p_user_id uuid, p_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_capabilities where user_id = p_user_id;

  if p_role in ('administrativo', 'docente', 'mantenimiento', 'secretaria', 'decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'generar_solicitudes')
    on conflict do nothing;
  end if;

  if p_role in ('secretaria', 'decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'revisar_solicitudes')
    on conflict do nothing;
  end if;

  if p_role in ('decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'aprobar_solicitudes')
    on conflict do nothing;
  end if;

  if p_role = 'decano' then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'gestionar_usuarios')
    on conflict do nothing;
  end if;
end;
$$;
