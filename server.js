import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(process.env.DB_PATH || path.join(__dirname, "data", "recall.sqlite"));
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "application/javascript; charset=utf-8"]],
]);

mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
initializeDatabase();

const server = createServer(async (request, response) => {
  try {
    addCorsHeaders(response);
    if (request.method === "OPTIONS") return sendEmpty(response, 204);

    const url = new URL(request.url, "http://localhost");

    if (url.pathname === "/api/health" && request.method === "GET") {
      const matches = db.prepare("SELECT COUNT(*) AS count FROM matches").get().count;
      return sendJson(response, 200, { ok: true, matches });
    }
    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      return sendJson(response, 200, getBootstrapPayload());
    }
    if (url.pathname === "/api/signals" && request.method === "POST") {
      return sendJson(response, 201, createSignal(await readJsonBody(request)));
    }
    if (url.pathname === "/api/dashboards" && request.method === "POST") {
      return sendJson(response, 201, createDashboard(await readJsonBody(request)));
    }
    if (url.pathname.startsWith("/api/dashboards/") && request.method === "DELETE") {
      deleteDashboard(decodeURIComponent(url.pathname.split("/").pop()));
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === "/api/matches" && request.method === "POST") {
      return sendJson(response, 201, createMatch(await readJsonBody(request)));
    }

    const publicFile = publicFiles.get(url.pathname);
    if (publicFile && request.method === "GET") {
      const [fileName, contentType] = publicFile;
      response.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": fileName === "index.html" ? "no-cache" : "public, max-age=3600",
      });
      response.end(readFileSync(path.join(__dirname, fileName)));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    sendJson(response, error instanceof HttpError ? error.status : 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => console.log(`Recall running at http://${host}:${port}`));

process.on("SIGTERM", () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function initializeDatabase() {
  const hasSchema = db
    .prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = 'signals'")
    .get();
  if (hasSchema) return;

  const migrations = [
    "drizzle/0000_steady_lockheed.sql",
    "drizzle/0001_noisy_rattler.sql",
    "drizzle/0002_import_local_data.sql",
  ];

  db.exec("BEGIN");
  try {
    for (const relativePath of migrations) {
      const sql = readFileSync(path.join(__dirname, relativePath), "utf8");
      db.exec(sql);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getBootstrapPayload() {
  return { signals: listSignals(), dashboards: listDashboards(), matches: listMatches() };
}

function listSignals() {
  return db
    .prepare("SELECT id, name, scope, description FROM signals ORDER BY created_at DESC, rowid DESC")
    .all();
}

function listDashboards() {
  const rows = db
    .prepare(
      `SELECT d.id, d.name, d.filters_json, ds.signal_id
       FROM dashboards d
       LEFT JOIN dashboard_signals ds ON ds.dashboard_id = d.id
       ORDER BY d.created_at DESC, d.rowid DESC`,
    )
    .all();
  const dashboards = new Map();
  for (const row of rows) {
    if (!dashboards.has(row.id)) {
      dashboards.set(row.id, {
        id: row.id,
        name: row.name,
        filters: JSON.parse(row.filters_json),
        signalIds: [],
      });
    }
    if (row.signal_id) dashboards.get(row.id).signalIds.push(row.signal_id);
  }
  return Array.from(dashboards.values());
}

function listMatches() {
  const matchRows = db
    .prepare(
      `SELECT id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json
       FROM matches
       ORDER BY date DESC, created_at DESC, rowid DESC`,
    )
    .all();
  const gameRows = db
    .prepare(
      `SELECT id, match_id, game_index, player_on_play, opening_hand_size, winner, coinflip_won, signals_json
       FROM games
       ORDER BY match_id, game_index ASC`,
    )
    .all();
  const membershipRows = db.prepare("SELECT match_id, dashboard_id FROM match_dashboards").all();

  const gamesByMatchId = new Map();
  for (const game of gameRows) {
    const games = gamesByMatchId.get(game.match_id) || [];
    games.push({
      id: game.id,
      playerOnPlay: game.player_on_play,
      openingHandSize: game.opening_hand_size,
      winner: game.winner,
      coinflipWon: game.coinflip_won === null ? null : Boolean(game.coinflip_won),
      signals: JSON.parse(game.signals_json),
    });
    gamesByMatchId.set(game.match_id, games);
  }

  const dashboardsByMatchId = new Map();
  for (const membership of membershipRows) {
    const ids = dashboardsByMatchId.get(membership.match_id) || [];
    ids.push(membership.dashboard_id);
    dashboardsByMatchId.set(membership.match_id, ids);
  }

  return matchRows.map((match) => ({
    id: match.id,
    date: match.date,
    deck: match.deck,
    opponent: match.opponent,
    format: match.format,
    playMode: match.play_mode,
    matchType: match.match_type,
    tags: JSON.parse(match.tags_json),
    notes: match.notes,
    winner: match.winner,
    signals: JSON.parse(match.signals_json),
    games: gamesByMatchId.get(match.id) || [],
    dashboardIds: dashboardsByMatchId.get(match.id) || [],
  }));
}

function createSignal(body) {
  assert(body.name, "Signal name is required.");
  assert(body.scope === "match" || body.scope === "game", "Signal scope must be `match` or `game`.");
  const signal = {
    id: crypto.randomUUID(),
    name: String(body.name).trim(),
    scope: body.scope,
    description: String(body.description || "").trim(),
  };
  assert(signal.name, "Signal name is required.");
  db.prepare("INSERT INTO signals (id, name, scope, description) VALUES (?, ?, ?, ?)").run(
    signal.id,
    signal.name,
    signal.scope,
    signal.description,
  );
  return signal;
}

function createDashboard(body) {
  assert(body.name, "Dashboard name is required.");
  const name = String(body.name).trim();
  const signalIds = Array.isArray(body.signalIds) ? body.signalIds.map(String) : [];
  const id = crypto.randomUUID();
  const filters = { deck: "", opponent: "", playMode: "", format: "", tag: "" };

  runInTransaction(() => {
    db.prepare("INSERT INTO dashboards (id, name, filters_json) VALUES (?, ?, ?)").run(
      id,
      name,
      JSON.stringify(filters),
    );
    const insert = db.prepare("INSERT INTO dashboard_signals (dashboard_id, signal_id) VALUES (?, ?)");
    for (const signalId of signalIds) insert.run(id, signalId);
  });
  return { id, name, filters, signalIds };
}

function deleteDashboard(dashboardId) {
  assert(dashboardId, "Dashboard id is required.");
  const dashboard = db.prepare("SELECT id FROM dashboards WHERE id = ?").get(dashboardId);
  if (!dashboard) throw new HttpError(404, "Dashboard not found.");
  db.prepare("DELETE FROM dashboards WHERE id = ?").run(dashboardId);
}

function createMatch(body) {
  assert(body.matchType === "bo1" || body.matchType === "bo3", "Match type must be `bo1` or `bo3`.");
  assert(Array.isArray(body.games) && body.games.length > 0, "At least one game is required.");
  const games = body.games.map(sanitizeGame);
  const dashboardIds = Array.isArray(body.dashboardIds) ? body.dashboardIds.map(String) : [];
  const match = {
    id: crypto.randomUUID(),
    date: String(body.date || getLocalDateString()),
    deck: String(body.deck || "Unspecified").trim(),
    opponent: String(body.opponent || "").trim(),
    format: String(body.format || "").trim(),
    playMode: String(body.playMode || "").trim(),
    matchType: body.matchType,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    notes: String(body.notes || "").trim(),
    winner: deriveMatchWinner(games),
    signals: sanitizeSignalMap(body.signals || {}),
    games,
    dashboardIds,
  };

  runInTransaction(() => {
    db.prepare(
      `INSERT INTO matches
       (id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      match.id,
      match.date,
      match.deck,
      match.opponent,
      match.format,
      match.playMode,
      match.matchType,
      JSON.stringify(match.tags),
      match.notes,
      match.winner,
      JSON.stringify(match.signals),
    );

    const insertGame = db.prepare(
      `INSERT INTO games
       (id, match_id, game_index, player_on_play, opening_hand_size, winner, coinflip_won, signals_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const [index, game] of games.entries()) {
      insertGame.run(
        crypto.randomUUID(),
        match.id,
        index + 1,
        game.playerOnPlay,
        game.openingHandSize,
        game.winner,
        game.coinflipWon === null ? null : Number(game.coinflipWon),
        JSON.stringify(game.signals),
      );
    }

    const insertDashboard = db.prepare(
      "INSERT INTO match_dashboards (match_id, dashboard_id) VALUES (?, ?)",
    );
    for (const dashboardId of dashboardIds) insertDashboard.run(match.id, dashboardId);
  });

  return listMatches().find((savedMatch) => savedMatch.id === match.id);
}

function runInTransaction(work) {
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function sanitizeGame(game) {
  assert(game.playerOnPlay === "me" || game.playerOnPlay === "opponent", "Invalid play order.");
  assert(game.winner === "me" || game.winner === "opponent", "Invalid game winner.");
  const openingHandSize = Number(game.openingHandSize);
  assert(Number.isInteger(openingHandSize) && openingHandSize >= 0 && openingHandSize <= 7, "Invalid hand size.");
  return {
    playerOnPlay: game.playerOnPlay,
    openingHandSize,
    winner: game.winner,
    coinflipWon: game.coinflipWon === null ? null : Boolean(game.coinflipWon),
    signals: sanitizeSignalMap(game.signals || {}),
  };
}

function sanitizeSignalMap(value) {
  return Object.fromEntries(Object.entries(value).map(([key, signalValue]) => [String(key), Boolean(signalValue)]));
}

function deriveMatchWinner(games) {
  const myWins = games.filter((game) => game.winner === "me").length;
  const opponentWins = games.filter((game) => game.winner === "opponent").length;
  return myWins >= opponentWins ? "me" : "opponent";
}

function assert(condition, message) {
  if (!condition) throw new HttpError(400, message);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function addCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode);
  response.end();
}

function getLocalDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
