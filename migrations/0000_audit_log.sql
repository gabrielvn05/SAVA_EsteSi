-- Migración Drizzle: tabla de auditoría (ver también sql/006-audit-log.sql para triggers)
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "table_name" text NOT NULL,
  "record_id" text NOT NULL,
  "action" text NOT NULL,
  "changed_by" uuid,
  "changed_at" timestamptz DEFAULT now() NOT NULL,
  "old_data" jsonb,
  "new_data" jsonb,
  "ip_address" text,
  "user_agent" text
);
