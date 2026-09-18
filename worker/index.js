const DEFAULT_SIGNALS = [
  {
    name: "Played Urza's Saga on turn 1",
    scope: "game",
    description: "Check this for any game where your first turn included Urza's Saga.",
  },
  {
    name: "Won the opening roll",
    scope: "match",
    description: "Usually based on the game 1 random determination.",
  },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      if (url.pathname === "/api/bootstrap" && request.method === "GET") {
        await seedDefaults(env.DB);
        return json(await getBootstrapPayload(env.DB));
      }

      if (url.pathname === "/api/signals" && request.method === "POST") {
        return json(await createSignal(env.DB, await request.json()), 201);
      }

      if (url.pathname === "/api/dashboards" && request.method === "POST") {
        return json(await createDashboard(env.DB, await request.json()), 201);
      }

      if (url.pathname.startsWith("/api/dashboards/") && request.method === "DELETE") {
        const dashboardId = decodeURIComponent(url.pathname.split("/").pop());
        await deleteDashboard(env.DB, dashboardId);
        return json({ ok: true });
      }

      if (url.pathname === "/api/matches" && request.method === "POST") {
        return json(await createMatch(env.DB, await request.json()), 201);
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Not found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      const status = error instanceof HttpError ? error.status : 500;
      return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, status);
    }
  },
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function seedDefaults(db) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM signals").first();
  if (Number(row?.count || 0) > 0) return;

  await db.batch(
    DEFAULT_SIGNALS.map((signal) =>
      db
        .prepare("INSERT INTO signals (id, name, scope, description) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), signal.name, signal.scope, signal.description),
    ),
  );
}

async function getBootstrapPayload(db) {
  const [signals, dashboards, matches] = await Promise.all([
    listSignals(db),
    listDashboards(db),
    listMatches(db),
  ]);
  return { signals, dashboards, matches };
}

async function listSignals(db) {
  const result = await db
    .prepare("SELECT id, name, scope, description FROM signals ORDER BY created_at DESC, rowid DESC")
    .all();
  return result.results;
}

async function listDashboards(db) {
  const result = await db
    .prepare(
      `SELECT d.id, d.name, d.filters_json, ds.signal_id
       FROM dashboards d
       LEFT JOIN dashboard_signals ds ON ds.dashboard_id = d.id
       ORDER BY d.created_at DESC, d.rowid DESC`,
    )
    .all();

  const dashboards = new Map();
  for (const row of result.results) {
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

async function listMatches(db) {
  const [matchResult, gameResult, membershipResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json
         FROM matches
         ORDER BY date DESC, created_at DESC, rowid DESC`,
      )
      .all(),
    db
      .prepare(
        `SELECT id, match_id, game_index, player_on_play, opening_hand_size, winner, coinflip_won, signals_json
         FROM games
         ORDER BY match_id, game_index ASC`,
      )
      .all(),
    db.prepare("SELECT match_id, dashboard_id FROM match_dashboards").all(),
  ]);

  const gamesByMatchId = new Map();
  for (const game of gameResult.results) {
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
  for (const membership of membershipResult.results) {
    const dashboardIds = dashboardsByMatchId.get(membership.match_id) || [];
    dashboardIds.push(membership.dashboard_id);
    dashboardsByMatchId.set(membership.match_id, dashboardIds);
  }

  return matchResult.results.map((match) => ({
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

async function createSignal(db, body) {
  assert(body.name, "Signal name is required.");
  assert(body.scope === "match" || body.scope === "game", "Signal scope must be `match` or `game`.");

  const signal = {
    id: crypto.randomUUID(),
    name: String(body.name).trim(),
    scope: body.scope,
    description: String(body.description || "").trim(),
  };
  assert(signal.name, "Signal name is required.");

  await db
    .prepare("INSERT INTO signals (id, name, scope, description) VALUES (?, ?, ?, ?)")
    .bind(signal.id, signal.name, signal.scope, signal.description)
    .run();
  return signal;
}

async function createDashboard(db, body) {
  assert(body.name, "Dashboard name is required.");
  const name = String(body.name).trim();
  assert(name, "Dashboard name is required.");
  const signalIds = Array.isArray(body.signalIds) ? body.signalIds.map(String) : [];
  const id = crypto.randomUUID();
  const filters = { deck: "", opponent: "", playMode: "", format: "", tag: "" };
  const statements = [
    db
      .prepare("INSERT INTO dashboards (id, name, filters_json) VALUES (?, ?, ?)")
      .bind(id, name, JSON.stringify(filters)),
    ...signalIds.map((signalId) =>
      db
        .prepare("INSERT INTO dashboard_signals (dashboard_id, signal_id) VALUES (?, ?)")
        .bind(id, signalId),
    ),
  ];

  await db.batch(statements);
  return { id, name, filters, signalIds };
}

async function deleteDashboard(db, dashboardId) {
  assert(dashboardId, "Dashboard id is required.");
  const dashboard = await db.prepare("SELECT id FROM dashboards WHERE id = ?").bind(dashboardId).first();
  if (!dashboard) throw new HttpError(404, "Dashboard not found.");

  await db.batch([
    db.prepare("DELETE FROM match_dashboards WHERE dashboard_id = ?").bind(dashboardId),
    db.prepare("DELETE FROM dashboard_signals WHERE dashboard_id = ?").bind(dashboardId),
    db.prepare("DELETE FROM dashboards WHERE id = ?").bind(dashboardId),
  ]);
}

async function createMatch(db, body) {
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

  const statements = [
    db
      .prepare(
        `INSERT INTO matches
         (id, date, deck, opponent, format, play_mode, match_type, tags_json, notes, winner, signals_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
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
      ),
    ...games.map((game, index) =>
      db
        .prepare(
          `INSERT INTO games
           (id, match_id, game_index, player_on_play, opening_hand_size, winner, coinflip_won, signals_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          match.id,
          index + 1,
          game.playerOnPlay,
          game.openingHandSize,
          game.winner,
          game.coinflipWon === null ? null : Number(game.coinflipWon),
          JSON.stringify(game.signals),
        ),
    ),
    ...dashboardIds.map((dashboardId) =>
      db
        .prepare("INSERT INTO match_dashboards (match_id, dashboard_id) VALUES (?, ?)")
        .bind(match.id, dashboardId),
    ),
  ];

  await db.batch(statements);
  return (await listMatches(db)).find((savedMatch) => savedMatch.id === match.id);
}

function sanitizeGame(game) {
  assert(game.playerOnPlay === "me" || game.playerOnPlay === "opponent", "Invalid play order.");
  assert(game.winner === "me" || game.winner === "opponent", "Invalid game winner.");
  const openingHandSize = Number(game.openingHandSize);
  assert(Number.isInteger(openingHandSize) && openingHandSize >= 0 && openingHandSize <= 7, "Invalid opening hand size.");

  return {
    playerOnPlay: game.playerOnPlay,
    openingHandSize,
    winner: game.winner,
    coinflipWon: game.coinflipWon === null ? null : Boolean(game.coinflipWon),
    signals: sanitizeSignalMap(game.signals || {}),
  };
}

function sanitizeSignalMap(value) {
  const output = {};
  for (const [key, signalValue] of Object.entries(value)) output[String(key)] = Boolean(signalValue);
  return output;
}

function deriveMatchWinner(games) {
  const myWins = games.filter((game) => game.winner === "me").length;
  const opponentWins = games.filter((game) => game.winner === "opponent").length;
  return myWins >= opponentWins ? "me" : "opponent";
}

function assert(condition, message) {
  if (!condition) throw new HttpError(400, message);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  };
}

function json(payload, status = 200) {
  return Response.json(payload, { status, headers: corsHeaders() });
}

function getLocalDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
