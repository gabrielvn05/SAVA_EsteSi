# Expediente de requerimientos funcionales — SAVA

## 1. Contexto

Sistema para la gestión de permisos y justificaciones del personal académico/administrativo, alineado a lineamientos DIIT-ULEAM.

## 2. Actores

- Administrativo (solicitante)
- Secretaría (revisión)
- Decano (aprobación y firma)
- Superusuario (administración)
- DIIT (hospedaje, seguridad, despliegue)

## 3. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-01 | Autenticación con credenciales institucionales y SSO Microsoft 365 | Alta |
| RF-02 | Solicitud de cuenta para nuevos usuarios con aprobación del Decano | Alta |
| RF-03 | Creación de solicitudes de permiso/justificación con adjuntos | Alta |
| RF-04 | Flujo de revisión por Secretaría | Alta |
| RF-05 | Aprobación/rechazo y firma por Decano | Alta |
| RF-06 | Generación de certificado PDF/DOCX de justificación | Alta |
| RF-07 | Firma electrónica de certificado con certificado .p12 | Media |
| RF-08 | Delegación de capacidades entre roles autorizados | Media |
| RF-09 | Dashboard con métricas de solicitudes | Media |
| RF-10 | Administración de usuarios (solo roles autorizados) | Alta |
| RF-11 | Notificación por correo al aprobar cuenta (clave temporal) | Alta |
| RF-12 | Cambio obligatorio de contraseña temporal | Alta |

## 4. Requerimientos no funcionales (DIIT)

| ID | Requerimiento |
|----|---------------|
| RNF-01 | Framework mantenido (Next.js/React) |
| RNF-02 | PostgreSQL como gestor relacional |
| RNF-03 | Contenedorización Docker |
| RNF-04 | Control de versiones Git / Azure DevOps |
| RNF-05 | Autenticación JWT y autorización por roles |
| RNF-06 | Auditoría de cambios en datos críticos |
| RNF-07 | Pruebas unitarias automatizadas en CI |
| RNF-08 | Documentación de API (OpenAPI) |
| RNF-09 | PWA instalable desde hospedaje institucional |
| RNF-10 | Sin secretos en código fuente |

## 5. Fases del ciclo de vida

1. Levantamiento de requerimientos (este documento)
2. Análisis funcional (flujos por rol)
3. Diseño técnico (`docs/manual-tecnico.md`)
4. Desarrollo (repositorio actual)
5. Pruebas (`npm run test`, validación DIIT)
6. Revisión y aprobación DIIT
7. Despliegue (Docker / ambiente DIIT)
8. Mantenimiento

## 6. Criterios de aceptación mínimos

- Usuario autenticado puede completar flujo solicitud → revisión → aprobación
- Roles no autorizados no acceden a funciones restringidas
- Auditoría registra cambios en solicitudes y perfiles
- Pipeline CI pasa lint, pruebas y build
- Documentación técnica, de usuario y diccionario de datos entregados
