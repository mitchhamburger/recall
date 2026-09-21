import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(process.env.DB_PATH || path.join(__dirname, "data", "recall.sqlite"));
const distDir = path.join(__dirname, "dist");

mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
initializeDatabase();
const scrypt = promisify(crypto.scrypt);
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

const server = createServer(async (request, response) => {
  try {
    addSecurityHeaders(response);
    const url = new URL(request.url, "http://localhost");

    if (url.pathname === "/api/health" && request.method === "GET") {
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      return sendJson(response, 200, { user: getAuthenticatedUser(request) });
    }
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const user = await registerUser(await readJsonBody(request));
      createSession(response, user.id);
      return sendJson(response, 201, { user: publicUser(user) });
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const user = await loginUser(await readJsonBody(request));
      createSession(response, user.id);
      return sendJson(response, 200, { user: publicUser(user) });
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      deleteSession(request);
      clearSessionCookie(response);
      return sendJson(response, 200, { ok: true });
    }

    const user = url.pathname.startsWith("/api/") ? requireAuthenticatedUser(request) : null;
    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      return sendJson(response, 200, getBootstrapPayload(user.id));
    }
    if (url.pathname === "/api/signals" && request.method === "POST") {
      return sendJson(response, 201, createSignal(user.id, await readJsonBody(request)));
    }
    if (url.pathname === "/api/dashboards" && request.method === "POST") {
      return sendJson(response, 201, createDashboard(user.id, await readJsonBody(request)));
    }
    const dashboardSignalRoute = url.pathname.match(/^\/api\/dashboards\/([^/]+)\/signals$/);
    if (dashboardSignalRoute && request.method === "POST") {
      return sendJson(
        response,
        201,
        createDashboardSignal(user.id, decodeURIComponent(dashboardSignalRoute[1]), await readJsonBody(request)),
      );
    }
    if (url.pathname.startsWith("/api/dashboards/") && request.method === "DELETE") {
      deleteDashboard(user.id, decodeURIComponent(url.pathname.split("/").pop()));
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === "/api/matches" && request.method === "POST") {
      return sendJson(response, 201, createMatch(user.id, await readJsonBody(request)));
    }

    if (request.method === "GET" && !url.pathname.startsWith("/api/")) {
      return sendFrontendFile(response, url.pathname);
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error(error);
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
  if (!hasSchema) {
    const migrations = [
      "drizzle/0000_steady_lockheed.sql",
      "drizzle/0001_noisy_rattler.sql",
      "drizzle/0002_import_local_data.sql",
    ];
    for (const relativePath of migrations) {
      runMigration(relativePath);
    }
  }

  const hasUsers = db
    .prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get();
  if (!hasUsers) runMigration("drizzle/0003_add_auth.sql");

  const matchColumns = db.prepare("PRAGMA table_info(matches)").all();
  if (!matchColumns.some((column) => column.name === "opening_roll_winner")) {
    runMigration("drizzle/0004_guided_match_fields.sql");
  }

  const signalColumns = db.prepare("PRAGMA table_info(signals)").all();
  if (!signalColumns.some((column) => column.name === "dashboard_id")) {
    runMigration("drizzle/0005_signal_ownership.sql");
  }

  const hasMigrationTable = db
    .prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = 'app_migrations'")
    .get();
  const hasLocalizedLegacySignals = hasMigrationTable
    ? db.prepare("SELECT 1 AS found FROM app_migrations WHERE name = ?").get("0006_localize_legacy_signals")
    : null;
  if (!hasLocalizedLegacySignals) runMigration("drizzle/0006_localize_legacy_signals.sql");
}

function runMigration(relativePath) {
  const sql = readFileSync(path.join(__dirname, relativePath), "utf8").replaceAll(
    "--> statement-breakpoint",
    "",
  );
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getBootstrapPayload(userId) {
  return { signals: listSignals(userId), dashboards: listDashboards(userId), matches: listMatches(userId) };
}

async function registerUser(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  assert(email, "A valid email address is required.");
  assert(password.length >= 8, "Password must be at least 8 characters.");
  assert(password.length <= 256, "Password is too long.");

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);
  const user = { id: crypto.randomUUID(), email };

  try {
    runInTransaction(() => {
      db.prepare(
        "INSERT INTO users (id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)",
      ).run(user.id, email, passwordHash, salt);

      // The first account adopts data from the original single-user deployment.
      const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
      if (userCount === 1) {
        db.prepare("UPDATE signals SET user_id = ? WHERE user_id IS NULL").run(user.id);
        db.prepare("UPDATE dashboards SET user_id = ? WHERE user_id IS NULL").run(user.id);
        db.prepare("UPDATE matches SET user_id = ? WHERE user_id IS NULL").run(user.id);
      }
    });
  } catch (error) {
    if (String(error?.message || "").includes("UNIQUE constraint failed")) {
      throw new HttpError(409, "An account with that email already exists.");
    }
    throw error;
  }

  return user;
}

async function loginUser(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const user = db
    .prepare("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?")
    .get(email);
  if (!user) throw new HttpError(401, "Invalid email or password.");

  const candidateHash = await hashPassword(password, user.password_salt);
  const stored = Buffer.from(user.password_hash, "hex");
  const candidate = Buffer.from(candidateHash, "hex");
  if (stored.length !== candidate.length || !crypto.timingSafeEqual(stored, candidate)) {
    throw new HttpError(401, "Invalid email or password.");
  }
  return user;
}

function createSession(response, userId) {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  const token = crypto.randomBytes(32).toString("base64url");
  const idHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    idHash,
    userId,
    expiresAt,
  );
  response.setHeader("Set-Cookie", sessionCookie(token, sessionMaxAgeSeconds));
}

function getAuthenticatedUser(request) {
  const token = parseCookies(request.headers.cookie || "").recall_session;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id_hash = ?`,
    )
    .get(hashSessionToken(token));
  if (!row) return null;
  if (row.expires_at <= new Date().toISOString()) {
    db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(hashSessionToken(token));
    return null;
  }
  return publicUser(row);
}

function requireAuthenticatedUser(request) {
  const user = getAuthenticatedUser(request);
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}

function deleteSession(request) {
  const token = parseCookies(request.headers.cookie || "").recall_session;
  if (token) db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(hashSessionToken(token));
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", sessionCookie("", 0));
}

function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" || process.env.RENDER === "true" ? "; Secure" : "";
  return `recall_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1
          ? [part, ""]
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt) {
  const derivedKey = await scrypt(password, salt, 64);
  return Buffer.from(derivedKey).toString("hex");
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : "";
}

function publicUser(user) {
  return { id: user.id, email: user.email };
}

function listSignals(userId) {
  return db
    .prepare(
      `SELECT id, name, scope, description, dashboard_id
       FROM signals
       WHERE user_id = ?
       ORDER BY created_at DESC, rowid DESC`,
    )
    .all(userId)
    .map((signal) => ({
      id: signal.id,
      name: signal.name,
      scope: signal.scope,
      description: signal.description,
      dashboardId: signal.dashboard_id,
    }));
}

function listDashboards(userId) {
  const rows = db
    .prepare(
      `SELECT d.id, d.name, d.filters_json, s.id AS signal_id
       FROM dashboards d
       LEFT JOIN signals s ON s.dashboard_id = d.id
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC, d.rowid DESC`,
    )
    .all(userId);
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

function listMatches(userId) {
  const matchRows = db
    .prepare(
      `SELECT id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json,
              opening_roll_winner
       FROM matches
       WHERE user_id = ?
       ORDER BY date DESC, created_at DESC, rowid DESC`,
    )
    .all(userId);
  const gameRows = db
    .prepare(
      `SELECT id, match_id, game_index, player_on_play, opening_hand_size, winner, coinflip_won, signals_json
       FROM games
       WHERE match_id IN (SELECT id FROM matches WHERE user_id = ?)
       ORDER BY match_id, game_index ASC`,
    )
    .all(userId);
  const membershipRows = db.prepare(
    "SELECT match_id, dashboard_id FROM match_dashboards WHERE match_id IN (SELECT id FROM matches WHERE user_id = ?)",
  ).all(userId);

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
    openingRollWinner: match.opening_roll_winner,
    tags: JSON.parse(match.tags_json),
    notes: match.notes,
    winner: match.winner,
    signals: JSON.parse(match.signals_json),
    games: gamesByMatchId.get(match.id) || [],
    dashboardIds: dashboardsByMatchId.get(match.id) || [],
  }));
}

function createSignal(userId, body) {
  return insertSignal(userId, null, body);
}

function createDashboard(userId, body) {
  assert(body.name, "Dashboard name is required.");
  const name = String(body.name).trim();
  const signals = Array.isArray(body.signals) ? body.signals.map(sanitizeSignalDefinition) : [];
  const id = crypto.randomUUID();
  const filters = { deck: "", opponent: "", playMode: "", format: "", tag: "" };
  const signalIds = [];

  runInTransaction(() => {
    db.prepare("INSERT INTO dashboards (id, name, filters_json, user_id) VALUES (?, ?, ?, ?)").run(
      id,
      name,
      JSON.stringify(filters),
      userId,
    );
    for (const signal of signals) signalIds.push(insertSignal(userId, id, signal).id);
  });
  return { id, name, filters, signalIds };
}

function createDashboardSignal(userId, dashboardId, body) {
  const dashboard = db.prepare("SELECT id FROM dashboards WHERE id = ? AND user_id = ?").get(dashboardId, userId);
  if (!dashboard) throw new HttpError(404, "Dashboard not found.");
  return insertSignal(userId, dashboardId, body);
}

function insertSignal(userId, dashboardId, body) {
  const signal = { id: crypto.randomUUID(), ...sanitizeSignalDefinition(body), dashboardId };
  db.prepare(
    "INSERT INTO signals (id, name, scope, description, user_id, dashboard_id) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(signal.id, signal.name, signal.scope, signal.description, userId, dashboardId);
  return signal;
}

function sanitizeSignalDefinition(body) {
  const signal = {
    name: String(body?.name || "").trim(),
    scope: body?.scope,
    description: String(body?.description || "").trim(),
  };
  assert(signal.name, "Signal name is required.");
  assert(signal.scope === "match" || signal.scope === "game", "Signal scope must be `match` or `game`.");
  return signal;
}

function deleteDashboard(userId, dashboardId) {
  assert(dashboardId, "Dashboard id is required.");
  const dashboard = db.prepare("SELECT id FROM dashboards WHERE id = ? AND user_id = ?").get(dashboardId, userId);
  if (!dashboard) throw new HttpError(404, "Dashboard not found.");
  db.prepare("DELETE FROM dashboards WHERE id = ?").run(dashboardId);
}

function createMatch(userId, body) {
  assert(["bo1", "bo3", "bo5"].includes(body.matchType), "Match type must be `bo1`, `bo3`, or `bo5`.");
  assert(
    body.openingRollWinner === "me" || body.openingRollWinner === "opponent",
    "Opening roll winner is required.",
  );
  assert(Array.isArray(body.games) && body.games.length > 0, "At least one game is required.");
  const games = body.games.map(sanitizeGame);
  const gamesToWin = { bo1: 1, bo3: 2, bo5: 3 }[body.matchType];
  const myWins = games.filter((game) => game.winner === "me").length;
  const opponentWins = games.filter((game) => game.winner === "opponent").length;
  assert(
    (myWins === gamesToWin && opponentWins < gamesToWin) ||
      (opponentWins === gamesToWin && myWins < gamesToWin),
    "The submitted games do not contain a completed match.",
  );
  assert(games.length <= gamesToWin * 2 - 1, "Too many games were submitted for this match type.");
  const dashboardIds = Array.isArray(body.dashboardIds) ? body.dashboardIds.map(String) : [];
  assertOwnedIds("dashboards", dashboardIds, userId, "One or more selected dashboards are unavailable.");
  assertAvailableSignalMap(userId, dashboardIds, body.signals || {}, "match");
  for (const game of body.games) assertAvailableSignalMap(userId, dashboardIds, game.signals || {}, "game");
  const match = {
    id: crypto.randomUUID(),
    date: String(body.date || getLocalDateString()),
    deck: String(body.deck || "Unspecified").trim(),
    opponent: String(body.opponent || "").trim(),
    format: String(body.format || "").trim(),
    playMode: String(body.playMode || "").trim(),
    matchType: body.matchType,
    openingRollWinner: body.openingRollWinner,
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
       (id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json, user_id,
        opening_roll_winner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      userId,
      match.openingRollWinner,
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

  return listMatches(userId).find((savedMatch) => savedMatch.id === match.id);
}

function assertOwnedIds(table, ids, userId, message) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  const count = db.prepare(
    `SELECT COUNT(*) AS count FROM ${table} WHERE user_id = ? AND id IN (${placeholders})`,
  ).get(userId, ...ids).count;
  if (count !== new Set(ids).size) throw new HttpError(400, message);
}

function assertAvailableSignalMap(userId, dashboardIds, signalMap, scope) {
  const ids = Object.keys(signalMap);
  if (ids.length === 0) return;
  const signalPlaceholders = ids.map(() => "?").join(",");
  const dashboardPlaceholders = dashboardIds.map(() => "?").join(",");
  const availability = dashboardIds.length
    ? `(dashboard_id IS NULL OR dashboard_id IN (${dashboardPlaceholders}))`
    : "dashboard_id IS NULL";
  const count = db.prepare(
    `SELECT COUNT(*) AS count FROM signals
     WHERE user_id = ? AND scope = ? AND ${availability} AND id IN (${signalPlaceholders})`,
  ).get(userId, scope, ...dashboardIds, ...ids).count;
  if (count !== new Set(ids).size) throw new HttpError(400, "One or more signals are unavailable.");
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

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function addSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function sendFrontendFile(response, pathname) {
  const requestedPath = path.resolve(distDir, `.${pathname}`);
  const isInsideDist = requestedPath === distDir || requestedPath.startsWith(`${distDir}${path.sep}`);
  const filePath =
    isInsideDist && existsSync(requestedPath) && statSync(requestedPath).isFile()
      ? requestedPath
      : path.join(distDir, "index.html");

  if (!existsSync(filePath)) {
    throw new HttpError(503, "The frontend has not been built. Run `npm run build` first.");
  }

  const extension = path.extname(filePath);
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
  };
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
  });
  response.end(readFileSync(filePath));
}

function getLocalDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
