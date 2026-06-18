-- Campos adicionales en solicitudes de cuenta (cédula, celular, carrera, jornada)
-- Ejecutar en Supabase → SQL Editor → New query → Run

alter table public.account_requests
  add column if not exists cedula text not null default '',
  add column if not exists celular text not null default '',
  add column if not exists carrera text not null default '',
  add column if not exists jornada text not null default '';