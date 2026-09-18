import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  scope: text("scope", { enum: ["match", "game"] }).notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filtersJson: text("filters_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  deck: text("deck").notNull(),
  opponent: text("opponent").notNull().default(""),
  format: text("format").notNull().default(""),
  playMode: text("play_mode").notNull().default(""),
  matchType: text("match_type", { enum: ["bo1", "bo3"] }).notNull(),
  tagsJson: text("tags_json").notNull(),
  notes: text("notes").notNull().default(""),
  winner: text("winner", { enum: ["me", "opponent"] }).notNull(),
  signalsJson: text("signals_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dashboardSignals = sqliteTable(
  "dashboard_signals",
  {
    dashboardId: text("dashboard_id")
      .notNull()
      .references(() => dashboards.id, { onDelete: "cascade" }),
    signalId: text("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.dashboardId, table.signalId] })],
);

export const matchDashboards = sqliteTable(
  "match_dashboards",
  {
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    dashboardId: text("dashboard_id")
      .notNull()
      .references(() => dashboards.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.dashboardId] }),
    index("idx_match_dashboards_dashboard_id").on(table.dashboardId),
  ],
);

export const games = sqliteTable(
  "games",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    gameIndex: integer("game_index").notNull(),
    playerOnPlay: text("player_on_play", { enum: ["me", "opponent"] }).notNull(),
    openingHandSize: integer("opening_hand_size").notNull(),
    winner: text("winner", { enum: ["me", "opponent"] }).notNull(),
    coinflipWon: integer("coinflip_won", { mode: "boolean" }),
    signalsJson: text("signals_json").notNull(),
  },
  (table) => [index("idx_games_match_id").on(table.matchId)],
);
