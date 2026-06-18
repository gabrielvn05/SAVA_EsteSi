# Manual técnico — SAVA

## Arquitectura

SAVA es una **Progressive Web Application (PWA)** construida con **Next.js 14** (React/TypeScript) como capa BFF y presentación, y **Supabase** (PostgreSQL) como backend de datos y autenticación.

### Estilo arquitectónico

- **Vertical Slicing** por dominio: `solicitudes`, `certificados`, `usuarios`, `auth`
- **CQRS**: comandos y consultas en `lib/cqrs/`
- **ORM**: Drizzle ORM (`lib/db/`) para acceso tipado a PostgreSQL
- **Separación de capas**: `app/` (UI/rutas), `lib/` (negocio), `components/` (presentación), `sql/` y `migrations/` (persistencia)

## Stack tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Runtime | Node.js | 22 LTS |
| Framework web | Next.js | 14.2.x |
| UI | React | 18.2.x |
| Lenguaje | TypeScript | 5.6.x |
| Base de datos | PostgreSQL (Supabase) | 16 |
| ORM | Drizzle ORM | 0.44.x |
| Autenticación | Supabase Auth + OAuth Azure (Microsoft 365) | JWT |
| Contenedores | Docker + Docker Compose | — |
| CI/CD | Azure Pipelines | `azure-pipelines.yml` |

## Autenticación y autorización

- **SSO**: inicio de sesión con Microsoft 365 (`provider: azure`)
- **JWT**: tokens gestionados por Supabase Auth (sesión en cookies HTTP-only)
- **Roles**: `superusuario`, `decano`, `secretaria`, `administrativo`
- **Autorización**: capacidades por rol + delegación (`user_capabilities`) + RLS en PostgreSQL

## API

- Documentación OpenAPI: `/api/docs` (Swagger UI)
- Especificación YAML: `/api/openapi`
- Contenedor de respuestas estándar: `lib/api/response.ts`
- Manejo de excepciones: `lib/api/with-api-handler.ts` + `middleware.ts`

## Infraestructura local

```bash
cp .env.example .env.local
docker compose up -d --build
```

Servicios:
- `postgres`: PostgreSQL 16 en puerto 5432
- `app`: aplicación Next.js en puerto 3000

## Migraciones de base de datos

1. Scripts iniciales: `sql/schema.sql`
2. Auditoría: `sql/006-audit-log.sql`
3. Migraciones ORM: `migrations/` gestionadas con `drizzle-kit`

```bash
npm run db:generate
npm run db:migrate
```

## Variables de entorno

Ver `.env.example`. Nunca commitear secretos.

## Logs y auditoría

- Logs categorizados: `lib/logging/logger.ts` (auth, api, db, security, audit, system)
- Auditoría en BD: tabla `audit_log` con triggers en `solicitudes`, `profiles`, `account_requests`

## Pruebas

```bash
npm run test
npm run test:coverage
```

## Despliegue

1. Pipeline Azure DevOps ejecuta lint, pruebas y build
2. Imagen Docker publicada con tag `sava:latest`
3. Ambientes de pruebas/producción administrados por DIIT

## Requisitos mínimos

- **Servidor**: 2 vCPU, 4 GB RAM, 20 GB disco
- **Software**: Docker 24+, Node.js 22 (desarrollo), PostgreSQL 16
- **Licencia**: software propietario institucional ULEAM (ver `docs/licencia.md`)
