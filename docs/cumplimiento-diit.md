# Matriz de cumplimiento — Lineamientos DIIT

| Requisito DIIT | Estado | Evidencia en el proyecto |
|----------------|--------|--------------------------|
| Metodología ágil / DevOps | Cumple | Azure Pipelines, Git |
| Arquitectura con separación de intereses | Cumple | `app/`, `lib/`, CQRS |
| CQRS | Cumple | `lib/cqrs/` |
| ORM | Cumple | Drizzle (`lib/db/`) |
| PostgreSQL / SQL Server | Cumple | Supabase/PostgreSQL |
| SSO Office 365 | Cumple | OAuth Azure en login |
| JWT + roles | Cumple | Supabase Auth + RLS |
| Paginación | Cumple | `PaginationControls`, `lib/pagination/` |
| Documentación API | Cumple | `docs/openapi.yaml`, `/api/docs` |
| Contenedor de respuestas | Cumple | `lib/api/response.ts` |
| Middleware excepciones | Cumple | `with-api-handler`, `error.tsx` |
| Migraciones SQL | Cumple | `migrations/`, `sql/`, drizzle-kit |
| Docker | Cumple | `Dockerfile`, `docker-compose.yml` |
| PWA | Cumple | `manifest.webmanifest`, `sw.js` |
| Framework reconocido | Cumple | Next.js 14 |
| Logs categorizados | Cumple | `lib/logging/logger.ts` |
| Auditoría | Cumple | `audit_log`, `sql/006-audit-log.sql` |
| Pruebas unitarias | Cumple | `tests/`, Vitest |
| Transferencia tecnológica | Cumple | `docs/manual-*.md`, diccionario, expediente |
| Stack principal C#/Blazor | Alternativa | React/Next.js (permitido como front alternativo) |
| Aspire Dev | Parcial | Orquestación vía Docker Compose (equivalente operativo) |
| Microsoft Identity directo | Parcial | Supabase Auth + Azure OAuth (JWT equivalente) |

## Notas para revisión DIIT

- El proyecto usa el **stack alternativo React/Next.js** autorizado en el documento.
- La autenticación institucional se realiza vía **Microsoft 365 (Azure AD)** integrado en Supabase.
- **Aspire** puede adoptarse cuando la DIIT provea el AppHost institucional; hoy la orquestación está en Docker Compose.
- Repositorio y tareas deben migrarse al **Azure DevOps institucional** al momento de entrega formal.
