import { pgTable, uuid, text, boolean, timestamp, jsonb, date, pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", [
  "superusuario",
  "decano",
  "secretaria",
  "administrativo",
  "docente",
  "mantenimiento"
]);
export const solicitudEstadoEnum = pgEnum("solicitud_estado", [
  "en_borrador",
  "en_revision_secretaria",
  "pendiente_aprobacion_decano",
  "aprobada",
  "rechazada"
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  rol: appRoleEnum("rol").notNull().default("administrativo"),
  activo: boolean("activo").notNull().default(true),
  cedula: text("cedula").notNull().default(""),
  celular: text("celular").notNull().default(""),
  carrera: text("carrera").notNull().default(""),
  jornada: text("jornada").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const solicitudes = pgTable("solicitudes", {
  id: uuid("id").primaryKey().defaultRandom(),
  creadoPor: uuid("creado_por").notNull(),
  tipo: text("tipo").notNull(),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  motivo: text("motivo").notNull(),
  detalle: jsonb("detalle").notNull().default({}),
  estado: solicitudEstadoEnum("estado").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(),
  changedBy: uuid("changed_by"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent")
});
