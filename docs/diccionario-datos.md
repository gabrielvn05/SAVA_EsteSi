# Diccionario de datos — SAVA

## `profiles`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | Identificador (referencia `auth.users`) |
| email | text | Correo institucional único |
| nombres | text | Nombres del usuario |
| apellidos | text | Apellidos |
| rol | app_role | Rol institucional |
| activo | boolean | Usuario habilitado |
| created_at | timestamptz | Fecha de creación |

## `solicitudes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | Identificador de solicitud |
| creado_por | uuid FK | Usuario solicitante |
| tipo | solicitud_tipo | Tipo de trámite |
| fecha_inicio | date | Inicio del permiso/justificación |
| fecha_fin | date | Fin del período |
| motivo | text | Motivo declarado |
| detalle | jsonb | Campos adicionales del wizard |
| justificativo_path | text | Ruta en Storage |
| justificativo_nombre | text | Nombre original del archivo |
| estado | solicitud_estado | Estado del workflow |
| revisado_por | uuid FK | Secretaría que revisó |
| firmado_por | uuid FK | Decano que firmó |
| observaciones_secretaria | text | Comentarios de revisión |
| observaciones_decano | text | Comentarios de aprobación/rechazo |
| fecha_firma | timestamptz | Momento de firma |
| created_at | timestamptz | Creación |
| updated_at | timestamptz | Última modificación |

## `user_capabilities`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_id | uuid FK | Usuario |
| capability | capability_type | Permiso delegado |
| otorgado_por | uuid FK | Quién delegó |
| created_at | timestamptz | Fecha de delegación |

## `account_requests`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | Solicitud de cuenta |
| email | text | Correo solicitado |
| nombres | text | Nombres |
| apellidos | text | Apellidos |
| rol_solicitado | app_role | Rol pedido |
| motivo | text | Justificación |
| status | account_request_status | pendiente/aprobada/rechazada |
| rechazo_comentario | text | Motivo de rechazo |
| handled_by | uuid FK | Quién procesó |
| handled_at | timestamptz | Cuándo se procesó |
| created_at | timestamptz | Fecha de solicitud |

## `audit_log`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | Registro de auditoría |
| table_name | text | Tabla afectada |
| record_id | text | ID del registro |
| action | text | INSERT, UPDATE, DELETE |
| changed_by | uuid | Usuario que realizó el cambio |
| changed_at | timestamptz | Momento del cambio |
| old_data | jsonb | Valores anteriores |
| new_data | jsonb | Valores nuevos |
| ip_address | text | IP (opcional) |
| user_agent | text | Agente (opcional) |

## Enumeraciones

- **app_role**: superusuario, decano, secretaria, administrativo
- **solicitud_tipo**: permiso, justificacion, viaje, enfermedad, calamidad_domestica, falta_marcado
- **solicitud_estado**: en_borrador, en_revision_secretaria, pendiente_aprobacion_decano, aprobada, rechazada
- **capability_type**: gestionar_usuarios, revisar_solicitudes, aprobar_solicitudes, generar_solicitudes
