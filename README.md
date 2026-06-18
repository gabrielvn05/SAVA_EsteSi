# SAVA - Permisos y Justificaciones

Sistema web **PWA** con `Next.js` + `Supabase` para gestionar permisos/justificaciones con flujo por roles. Alineado a **lineamientos DIIT-ULEAM**.

## Cumplimiento DIIT

Ver matriz completa en [`docs/cumplimiento-diit.md`](docs/cumplimiento-diit.md).

Incluye: CQRS, ORM (Drizzle), Docker, PWA, OpenAPI, auditoría, logs, pruebas, CI/CD (Azure Pipelines) y documentación de transferencia tecnológica.

## Roles implementados

- `administrativo`: crea, edita y visualiza solicitudes.
- `secretaria`: revisa solicitudes y las envía a Decano.
- `decano`: aprueba/firma solicitudes y es el único que crea usuarios y delega funcionalidades.
- `superusuario`: acceso total al flujo funcional.

## Configuración rápida

1. Instala dependencias:
   - `npm install`
2. Crea `.env.local` desde `.env.example`.
3. Ejecuta `sql/schema.sql` y `sql/006-audit-log.sql` en Supabase SQL Editor.
4. Crea usuarios de prueba:
   - `npm run seed`
5. Levanta el proyecto:
   - `npm run dev`

## Docker (recomendado DIIT)

```bash
cp .env.example .env
# Complete las variables Supabase en .env
docker compose up -d --build
```

App: http://localhost:3000 — PostgreSQL: localhost:5432

## Pruebas

```bash
npm run test
npm run test:coverage
```

## API

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI: http://localhost:3000/api/openapi

## Migraciones ORM

```bash
npm run db:generate
npm run db:migrate
```

## Documentación de entrega

- [`docs/expediente-requerimientos.md`](docs/expediente-requerimientos.md)
- [`docs/manual-tecnico.md`](docs/manual-tecnico.md)
- [`docs/manual-usuario.md`](docs/manual-usuario.md)
- [`docs/diccionario-datos.md`](docs/diccionario-datos.md)
- [`docs/licencia.md`](docs/licencia.md)

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL` (PostgreSQL para ORM/migraciones)
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## CI/CD

Pipeline Azure DevOps: `azure-pipelines.yml` (lint, pruebas, build, imagen Docker).

## Importante

La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend. Nunca la expongas en el frontend.
