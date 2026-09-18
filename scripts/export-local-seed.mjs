import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const database = new DatabaseSync(path.join(root, "data", "recall.sqlite"), { readOnly: true });
const tables = ["signals", "dashboards", "matches", "games", "dashboard_signals", "match_dashboards"];
const statements = [
  "-- Snapshot of the local Recall data at the time hosted persistence was introduced.",
  "-- INSERT OR IGNORE keeps this migration safe if defaults already exist.",
];

for (const table of tables) {
  const rows = database.prepare(`SELECT * FROM ${table}`).all();
  for (const row of rows) {
    const columns = Object.keys(row).map(quoteIdentifier).join(", ");
    const values = Object.values(row).map(quoteValue).join(", ");
    statements.push(`INSERT OR IGNORE INTO ${quoteIdentifier(table)} (${columns}) VALUES (${values});`);
    statements.push("--> statement-breakpoint");
  }
}

writeFileSync(path.join(root, "drizzle", "0002_import_local_data.sql"), `${statements.join("\n")}\n`);

function quoteIdentifier(value) {
  return `\`${String(value).replaceAll("`", "``")}\``;
}

function quoteValue(value) {
  if (value === null) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}
