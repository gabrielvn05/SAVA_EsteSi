#!/usr/bin/env node
/**
 * Aplica columnas cedula, celular, carrera y jornada en account_requests.
 * Requiere DATABASE_URL en .env.local (Supabase → Project Settings → Database → URI).
 *
 * Uso: npm run db:migrate-account-requests
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const SQL = `
alter table public.account_requests
  add column if not exists cedula text not null default '',
  add column if not exists celular text not null default '',
  add column if not exists carrera text not null default '',
  add column if not exists jornada text not null default '';
`;

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "Falta DATABASE_URL en .env.local.\n" +
        "En Supabase: Project Settings → Database → Connection string (URI).\n" +
        "O ejecuta el SQL manualmente en el editor SQL del panel de Supabase:\n" +
        "  sql/007-account-requests-campos.sql"
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL);
    console.log("Migración aplicada: account_requests (cedula, celular, carrera, jornada).");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error al migrar:", err.message);
  process.exit(1);
});
