const state = {
  user: null,
  signals: [],
  dashboards: [],
  matches: [],
  loading: true,
  activeView: "overview",
  activeDashboardId: null,
  pendingMatchDashboardId: null,
  theme: "ledger",
  signalPresenceFilters: {},
};

const els = {
  authShell: document.getElementById("auth-shell"),
  appShell: document.getElementById("app-shell"),
  loginForm: document.getElementById("login-form"),
  registerForm: document.getElementById("register-form"),
  showLoginButton: document.getElementById("show-login-button"),
  showRegisterButton: document.getElementById("show-register-button"),
  authMessage: document.getElementById("auth-message"),
  accountEmail: document.getElementById("account-email"),
  logoutButton: document.getElementById("logout-button"),
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  views: Array.from(document.querySelectorAll(".view")),
  heroStats: document.getElementById("hero-stats"),
  signalForm: document.getElementById("signal-form"),
  signalList: document.getElementById("signal-list"),
  dashboardForm: document.getElementById("dashboard-form"),
  dashboardSignalPicker: document.getElementById("dashboard-signal-picker"),
  dashboardDirectory: document.getElementById("dashboard-directory"),
  matchForm: document.getElementById("match-form"),
  matchSignalFields: document.getElementById("match-signal-fields"),
  gamesContainer: document.getElementById("games-container"),
  addGameButton: document.getElementById("add-game-button"),
  resetGamesButton: document.getElementById("reset-games-button"),
  matchList: document.getElementById("match-list"),
  overviewDashboardHero: document.getElementById("overview-dashboard-hero"),
  overviewDashboardList: document.getElementById("overview-dashboard-list"),
  dashboardHighlights: document.getElementById("dashboard-highlights"),
  gameCardTemplate: document.getElementById("game-card-template"),
  dashboardDetailTitle: document.getElementById("dashboard-detail-title"),
  dashboardDetailSummary: document.getElementById("dashboard-detail-summary"),
  dashboardDetailMetrics: document.getElementById("dashboard-detail-metrics"),
  dashboardDetailMatches: document.getElementById("dashboard-detail-matches"),
  dashboardDetailLogButton: document.getElementById("dashboard-detail-log-button"),
  dashboardDetailDeleteButton: document.getElementById("dashboard-detail-delete-button"),
  dashboardDetailBackButton: document.getElementById("dashboard-detail-back-button"),
  matchDashboardBanner: document.getElementById("match-dashboard-banner"),
  matchDashboardBannerCopy: document.getElementById("match-dashboard-banner-copy"),
  clearMatchDashboardButton: document.getElementById("clear-match-dashboard-button"),
  themeButtons: Array.from(document.querySelectorAll(".theme-button")),
};

init().catch((error) => {
  console.error(error);
  showAuthMessage("Recall couldn't connect to the server. Please try again.");
});

async function init() {
  bindAuthControls();
  bindNavigation();
  bindThemePicker();
  bindSignalForm();
  bindDashboardForm();
  bindMatchForm();
  bindGameControls();
  bindDashboardDetailControls();
  ensureGameCardsForMatchType();
  loadThemePreference();
  const payload = await request("/api/auth/session");
  if (payload.user) {
    await enterApp(payload.user);
  } else {
    showAuthShell();
  }
}

function bindAuthControls() {
  els.showLoginButton.addEventListener("click", () => showAuthMode("login"));
  els.showRegisterButton.addEventListener("click", () => showAuthMode("register"));

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(els.loginForm, "/api/auth/login");
  });

  els.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAuthForm(els.registerForm, "/api/auth/register");
  });

  els.logoutButton.addEventListener("click", async () => {
    await request("/api/auth/logout", { method: "POST" });
    state.user = null;
    state.signals = [];
    state.dashboards = [];
    state.matches = [];
    state.activeDashboardId = null;
    state.pendingMatchDashboardId = null;
    showAuthShell();
  });
}

async function submitAuthForm(form, path) {
  hideAuthMessage();
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  submitButton.disabled = true;
  try {
    const payload = await request(path, {
      method: "POST",
      body: JSON.stringify({
        email: String(formData.get("email")).trim(),
        password: String(formData.get("password")),
      }),
    });
    form.reset();
    await enterApp(payload.user);
  } catch (error) {
    showAuthMessage(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

async function enterApp(user) {
  state.user = user;
  els.accountEmail.textContent = user.email;
  els.authShell.hidden = true;
  els.appShell.hidden = false;
  state.loading = true;
  setActiveView("overview");
  await refreshState();
}

function showAuthShell() {
  els.appShell.hidden = true;
  els.authShell.hidden = false;
  showAuthMode("login");
}

function showAuthMode(mode) {
  const isLogin = mode === "login";
  els.loginForm.hidden = !isLogin;
  els.registerForm.hidden = isLogin;
  els.showLoginButton.classList.toggle("active", isLogin);
  els.showRegisterButton.classList.toggle("active", !isLogin);
  hideAuthMessage();
}

function showAuthMessage(message) {
  els.authMessage.textContent = message;
  els.authMessage.hidden = false;
}

function hideAuthMessage() {
  els.authMessage.hidden = true;
  els.authMessage.textContent = "";
}

async function refreshState() {
  state.loading = true;
  render();
  const payload = await request("/api/bootstrap");
  state.signals = payload.signals;
  state.dashboards = payload.dashboards;
  state.matches = payload.matches;
  if (state.activeDashboardId && !state.dashboards.some((dashboard) => dashboard.id === state.activeDashboardId)) {
    state.activeDashboardId = null;
  }
  state.loading = false;
  render();
}

function bindNavigation() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });
}

function bindThemePicker() {
  els.themeButtons.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.theme));
  });
}

function bindSignalForm() {
  els.signalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.signalForm);
    await request("/api/signals", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name")).trim(),
        scope: String(formData.get("scope")),
        description: String(formData.get("description")).trim(),
      }),
    });
    els.signalForm.reset();
    await refreshState();
  });
}

function bindDashboardForm() {
  els.dashboardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.dashboardForm);
    const signalIds = state.signals
      .filter((signal) => formData.get(`dashboard-signal-${signal.id}`) === "on")
      .map((signal) => signal.id);

    const dashboard = await request("/api/dashboards", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name")).trim(),
        signalIds,
      }),
    });

    els.dashboardForm.reset();
    await refreshState();
    openDashboardDetail(dashboard.id);
  });
}

function bindMatchForm() {
  els.matchForm.elements.matchType.addEventListener("change", ensureGameCardsForMatchType);

  els.matchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.matchForm);
    const games = readGamesFromForm();
    if (games.length === 0) {
      return;
    }

    const signals = {};
    getSignalsByScope("match").forEach((signal) => {
      signals[signal.id] = formData.get(`match-signal-${signal.id}`) === "on";
    });

    await request("/api/matches", {
      method: "POST",
      body: JSON.stringify({
        matchType: String(formData.get("matchType")),
        notes: String(formData.get("notes")).trim(),
        signals,
        games,
        dashboardIds: state.pendingMatchDashboardId ? [state.pendingMatchDashboardId] : [],
      }),
    });

    const dashboardId = state.pendingMatchDashboardId;
    els.matchForm.reset();
    ensureGameCardsForMatchType();
    state.pendingMatchDashboardId = null;
    await refreshState();

    if (dashboardId) {
      openDashboardDetail(dashboardId);
      return;
    }

    setActiveView("matches");
  });

  els.clearMatchDashboardButton.addEventListener("click", () => {
    state.pendingMatchDashboardId = null;
    renderMatchDashboardBanner();
  });
}

function bindGameControls() {
  els.addGameButton.addEventListener("click", () => {
    appendGameCard();
    refreshGameLabels();
  });

  els.resetGamesButton.addEventListener("click", ensureGameCardsForMatchType);
}

function bindDashboardDetailControls() {
  els.dashboardDetailLogButton.addEventListener("click", () => {
    if (!state.activeDashboardId) {
      return;
    }
    state.pendingMatchDashboardId = state.activeDashboardId;
    setActiveView("matches");
    render();
  });

  els.dashboardDetailBackButton.addEventListener("click", () => {
    setActiveView("dashboards");
  });

  els.dashboardDetailDeleteButton.addEventListener("click", async () => {
    const dashboard = state.dashboards.find((item) => item.id === state.activeDashboardId);
    if (!dashboard) {
      return;
    }

    const confirmed = window.confirm(`Delete dashboard "${dashboard.name}"? Matches will remain logged.`);
    if (!confirmed) {
      return;
    }

    await request(`/api/dashboards/${dashboard.id}`, { method: "DELETE" });
    state.activeDashboardId = null;
    await refreshState();
    setActiveView("dashboards");
  });
}

function setActiveView(viewName) {
  state.activeView = viewName;
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  els.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
  renderMatchDashboardBanner();
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem("recall-theme");
  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }
  applyTheme(state.theme);
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.body.dataset.theme = themeName;
  localStorage.setItem("recall-theme", themeName);
  els.themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === themeName);
  });
}

function openDashboardDetail(dashboardId) {
  state.activeDashboardId = dashboardId;
  setActiveView("dashboard-detail");
  render();
}

function ensureGameCardsForMatchType() {
  els.gamesContainer.innerHTML = "";
  const count = els.matchForm?.elements.matchType?.value === "bo1" ? 1 : 3;
  for (let index = 0; index < count; index += 1) {
    appendGameCard();
  }
  refreshGameLabels();
}

function appendGameCard() {
  const fragment = els.gameCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".game-card");
  const removeButton = card.querySelector(".remove-game-button");
  const signalsContainer = card.querySelector(".game-signals");

  const signalGrid = document.createElement("div");
  signalGrid.className = "checkbox-grid";
  signalGrid.append(...getGameSignalCards());
  signalsContainer.append(signalGrid);

  removeButton.addEventListener("click", () => {
    if (els.gamesContainer.children.length === 1) {
      return;
    }
    card.remove();
    refreshGameLabels();
  });

  els.gamesContainer.append(fragment);
}

function getGameSignalCards() {
  const signals = getSignalsByScope("game");
  if (signals.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "empty-state";
    placeholder.textContent = "Create a game-level signal and it will appear here.";
    return [placeholder];
  }

  return signals.map((signal) =>
    createCheckboxCard({
      name: `game-signal-${signal.id}`,
      title: signal.name,
      description: signal.description || "No description provided.",
    }),
  );
}

function readGamesFromForm() {
  return Array.from(els.gamesContainer.querySelectorAll(".game-card")).map((card) => {
    const signalValues = {};
    getSignalsByScope("game").forEach((signal) => {
      signalValues[signal.id] = Boolean(
        card.querySelector(`input[name="game-signal-${signal.id}"]`)?.checked,
      );
    });

    return {
      playerOnPlay: card.querySelector(".game-play-order").value,
      openingHandSize: Number(card.querySelector(".game-opening-hand").value),
      winner: card.querySelector(".game-winner").value,
      coinflipWon:
        card.querySelector(".game-coinflip").value === ""
          ? null
          : card.querySelector(".game-coinflip").value === "yes",
      signals: signalValues,
    };
  });
}

function getSignalsByScope(scope) {
  return state.signals.filter((signal) => signal.scope === scope);
}

function render() {
  renderHeroStats();
  renderSignalList();
  renderDashboardSignalPicker();
  renderMatchSignalFields();
  rerenderGameSignalFields();
  renderMatchList();
  renderOverviewDashboardHero();
  renderDashboardDirectory();
  renderOverviewDashboards();
  renderDashboardHighlights();
  renderDashboardDetail();
  renderMatchDashboardBanner();
}

function renderHeroStats() {
  if (state.loading) {
    els.heroStats.innerHTML = statChip("Status", "Loading");
    return;
  }

  const matches = state.matches.length;
  const games = state.matches.reduce((sum, match) => sum + match.games.length, 0);
  const matchWins = state.matches.filter((match) => match.winner === "me").length;
  const winRate = matches === 0 ? "0%" : `${Math.round((matchWins / matches) * 100)}%`;

  els.heroStats.innerHTML = [
    statChip("Matches", matches),
    statChip("Games", games),
    statChip("Match Win Rate", winRate),
  ].join("");
}

function renderSignalList() {
  if (state.loading) {
    els.signalList.innerHTML = emptyState("Loading signals...");
    return;
  }

  if (state.signals.length === 0) {
    els.signalList.innerHTML = emptyState("No signals yet.");
    return;
  }

  els.signalList.innerHTML = state.signals
    .map(
      (signal) => `
        <article class="list-card">
          <div class="summary-row">
            <h4>${escapeHtml(signal.name)}</h4>
            <span class="pill">${signal.scope}</span>
          </div>
          <p class="muted">${escapeHtml(signal.description || "No description provided.")}</p>
        </article>
      `,
    )
    .join("");
}

function renderDashboardSignalPicker() {
  if (state.loading) {
    els.dashboardSignalPicker.innerHTML = emptyState("Loading signals...");
    return;
  }

  if (state.signals.length === 0) {
    els.dashboardSignalPicker.innerHTML = emptyState("Create signals first.");
    return;
  }

  els.dashboardSignalPicker.innerHTML = "";
  state.signals.forEach((signal) => {
    els.dashboardSignalPicker.append(
      createCheckboxCard({
        name: `dashboard-signal-${signal.id}`,
        title: signal.name,
        description: `${signal.scope} signal`,
      }),
    );
  });
}

function renderMatchSignalFields() {
  if (state.loading) {
    els.matchSignalFields.innerHTML = emptyState("Loading match signals...");
    return;
  }

  const signals = getSignalsByScope("match");
  if (signals.length === 0) {
    els.matchSignalFields.innerHTML = emptyState("No match-level signals yet.");
    return;
  }

  els.matchSignalFields.innerHTML = "";
  signals.forEach((signal) => {
    els.matchSignalFields.append(
      createCheckboxCard({
        name: `match-signal-${signal.id}`,
        title: signal.name,
        description: signal.description || "No description provided.",
      }),
    );
  });
}

function rerenderGameSignalFields() {
  Array.from(els.gamesContainer.querySelectorAll(".game-signals")).forEach((container) => {
    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "checkbox-grid";
    grid.append(...getGameSignalCards());
    container.append(grid);
  });
}

function renderMatchList() {
  if (state.loading) {
    els.matchList.innerHTML = emptyState("Loading matches...");
    return;
  }

  if (state.matches.length === 0) {
    els.matchList.innerHTML = emptyState("No matches logged yet.");
    return;
  }

  els.matchList.innerHTML = state.matches.map(renderMatchCard).join("");
}

function renderOverviewDashboards() {
  if (state.loading) {
    els.overviewDashboardList.innerHTML = emptyState("Loading dashboards...");
    return;
  }

  if (state.dashboards.length === 0) {
    els.overviewDashboardList.innerHTML = emptyState("No dashboards created yet.");
    return;
  }

  els.overviewDashboardList.innerHTML = `<div class="dashboard-list-grid">${state.dashboards
    .map((dashboard) => {
      const summary = getDashboardSummary(dashboard);
      return `
        <article class="list-card clickable" data-dashboard-open="${dashboard.id}">
          <div class="summary-row">
            <div>
              <h4>${escapeHtml(dashboard.name)}</h4>
              <p class="muted">${summary.matchesPlayed} matches played</p>
            </div>
            <div>
              <strong>${summary.winRateLabel}</strong>
              <div class="muted">match win rate</div>
            </div>
          </div>
          <div class="signal-bar">
            <div class="signal-bar-fill" style="width: ${summary.winRatePercent}%"></div>
          </div>
        </article>
      `;
    })
    .join("")}</div>`;

  els.overviewDashboardList.querySelectorAll("[data-dashboard-open]").forEach((node) => {
    node.addEventListener("click", () => openDashboardDetail(node.dataset.dashboardOpen));
  });
}

function renderOverviewDashboardHero() {
  if (state.loading) {
    els.overviewDashboardHero.innerHTML = emptyState("Loading dashboards...");
    return;
  }

  if (state.dashboards.length === 0) {
    els.overviewDashboardHero.innerHTML = emptyState("No dashboards created yet.");
    return;
  }

  els.overviewDashboardHero.innerHTML = state.dashboards
    .map((dashboard) => {
      const summary = getDashboardSummary(dashboard);
      return `
        <article class="metric-card dashboard-summary-card clickable" data-dashboard-open="${dashboard.id}">
          <div class="dashboard-summary-head">
            <div>
              <h4>${escapeHtml(dashboard.name)}</h4>
              <p class="muted">${summary.matchesPlayed} matches in this view</p>
            </div>
            <span class="pill">${summary.gameWinRateLabel} game WR</span>
          </div>
          <div class="dashboard-summary-stats">
            <div class="stat-block">
              <span class="muted">Match Win Rate</span>
              <strong>${summary.winRateLabel}</strong>
            </div>
            <div class="stat-block">
              <span class="muted">Matches Won</span>
              <strong>${summary.matchWins}/${summary.matchesPlayed}</strong>
            </div>
            <div class="stat-block">
              <span class="muted">Games Won</span>
              <strong>${summary.gameWins}/${summary.totalGames}</strong>
            </div>
          </div>
          <div class="signal-bar">
            <div class="signal-bar-fill" style="width: ${summary.winRatePercent}%"></div>
          </div>
        </article>
      `;
    })
    .join("");

  els.overviewDashboardHero.querySelectorAll("[data-dashboard-open]").forEach((node) => {
    node.addEventListener("click", () => openDashboardDetail(node.dataset.dashboardOpen));
  });
}

function renderDashboardHighlights() {
  if (state.loading) {
    els.dashboardHighlights.innerHTML = emptyState("Loading dashboards...");
    return;
  }

  if (state.dashboards.length === 0) {
    els.dashboardHighlights.innerHTML = emptyState("No dashboards created yet.");
    return;
  }

  const summaries = state.dashboards.map(getDashboardSummary);

  const mostPlayed = [...summaries].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0];
  const bestWinRate = [...summaries]
    .filter((item) => item.matchesPlayed > 0)
    .sort((a, b) => b.winRate - a.winRate)[0];
  const strongestGameRate = [...summaries]
    .filter((item) => item.totalGames > 0)
    .sort((a, b) => b.gameWinRate - a.gameWinRate)[0];

  const cards = [];

  if (mostPlayed) {
    cards.push(`
      <article class="metric-card">
        <h4>Most Played Dashboard</h4>
        <p class="metric-value">${escapeHtml(mostPlayed.dashboard.name)}</p>
        <p class="muted">${mostPlayed.matchesPlayed} matches logged</p>
      </article>
    `);
  }

  if (bestWinRate) {
    cards.push(`
      <article class="metric-card">
        <h4>Best Current Win Rate</h4>
        <p class="metric-value">${bestWinRate.winRateLabel}</p>
        <p class="muted">${escapeHtml(bestWinRate.dashboard.name)} across ${bestWinRate.matchesPlayed} matches</p>
      </article>
    `);
  }

  if (strongestGameRate) {
    cards.push(`
      <article class="metric-card">
        <h4>Best Game Win Rate</h4>
        <p class="metric-value">${strongestGameRate.gameWinRateLabel}</p>
        <p class="muted">${escapeHtml(strongestGameRate.dashboard.name)} across ${strongestGameRate.totalGames} games</p>
      </article>
    `);
  }

  if (cards.length === 0) {
    els.dashboardHighlights.innerHTML = emptyState("Log a few dashboard matches to surface highlights.");
    return;
  }

  els.dashboardHighlights.innerHTML = cards.join("");
}

function renderDashboardDirectory() {
  if (state.loading) {
    els.dashboardDirectory.innerHTML = emptyState("Loading dashboards...");
    return;
  }

  if (state.dashboards.length === 0) {
    els.dashboardDirectory.innerHTML = emptyState("No dashboards created yet.");
    return;
  }

  els.dashboardDirectory.innerHTML = state.dashboards
    .map((dashboard) => {
      const summary = getDashboardSummary(dashboard);
      return `
        <article class="list-card clickable" data-dashboard-open="${dashboard.id}">
          <div class="summary-row">
            <div>
              <h4>${escapeHtml(dashboard.name)}</h4>
              <p class="muted">${summary.matchesPlayed} matches assigned</p>
            </div>
            <div>
              <strong>${summary.winRateLabel}</strong>
              <div class="muted">match win rate</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els.dashboardDirectory.querySelectorAll("[data-dashboard-open]").forEach((node) => {
    node.addEventListener("click", () => openDashboardDetail(node.dataset.dashboardOpen));
  });
}

function renderDashboardDetail() {
  const dashboard = state.dashboards.find((item) => item.id === state.activeDashboardId);
  if (!dashboard) {
    els.dashboardDetailTitle.textContent = "Dashboard";
    els.dashboardDetailSummary.textContent = "Pick a dashboard from the list to inspect it.";
    els.dashboardDetailMetrics.innerHTML = emptyState("No dashboard selected.");
    els.dashboardDetailMatches.innerHTML = emptyState("No dashboard selected.");
    return;
  }

  const matches = getMatchesForDashboard(dashboard);
  const summary = getDashboardSummary(dashboard);
  const metrics = dashboard.signalIds
    .map((signalId) => state.signals.find((item) => item.id === signalId))
    .filter(Boolean)
    .map((signal) => renderSignalMetric(signal, matches))
    .join("");

  els.dashboardDetailTitle.textContent = dashboard.name;
  els.dashboardDetailSummary.textContent = `${matches.length} matches assigned to this dashboard.`;
  els.dashboardDetailDeleteButton.hidden = false;
  els.dashboardDetailMetrics.innerHTML = `
    <div class="metric-grid">
      <article class="metric-card">
        <h4>Match Win Rate</h4>
        <p class="metric-value">${summary.winRateLabel}</p>
        <p class="muted">${summary.matchWins}/${summary.matchesPlayed} matches</p>
      </article>
      <article class="metric-card">
        <h4>Game Win Rate</h4>
        <p class="metric-value">${summary.gameWinRateLabel}</p>
        <p class="muted">${summary.gameWins}/${summary.totalGames} games</p>
      </article>
    </div>
    ${metrics || emptyState("Choose signals in this dashboard to see conditional win rates.")}
  `;
  els.dashboardDetailMatches.innerHTML = matches.length
    ? matches.map(renderMatchCard).join("")
    : emptyState("No matches assigned to this dashboard yet.");

  els.dashboardDetailMetrics.querySelectorAll("[data-signal-presence-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      state.signalPresenceFilters[input.dataset.signalPresenceToggle] = input.checked;
      renderDashboardDetail();
    });
  });
}

function getMatchesForDashboard(dashboard) {
  return state.matches.filter(
    (match) => Array.isArray(match.dashboardIds) && match.dashboardIds.includes(dashboard.id),
  );
}

function getDashboardSummary(dashboard) {
  const matches = getMatchesForDashboard(dashboard);
  const matchWins = matches.filter((match) => match.winner === "me").length;
  const totalGames = matches.reduce((sum, match) => sum + match.games.length, 0);
  const gameWins = matches.reduce(
    (sum, match) => sum + match.games.filter((game) => game.winner === "me").length,
    0,
  );

  return {
    dashboard,
    matches,
    matchesPlayed: matches.length,
    matchWins,
    totalGames,
    gameWins,
    winRate: matches.length === 0 ? 0 : matchWins / matches.length,
    gameWinRate: totalGames === 0 ? 0 : gameWins / totalGames,
    winRatePercent: matches.length === 0 ? 0 : Math.round((matchWins / matches.length) * 100),
    winRateLabel: percent(matchWins, matches.length),
    gameWinRateLabel: percent(gameWins, totalGames),
  };
}

function renderSignalMetric(signal, matches) {
  const whenPresent = state.signalPresenceFilters[signal.id] ?? true;

  if (signal.scope === "match") {
    const present = matches.filter((match) => match.signals?.[signal.id]);
    const absent = matches.filter((match) => !match.signals?.[signal.id]);
    const relevantMatches = whenPresent ? present : absent;
    const wins = relevantMatches.filter((match) => match.winner === "me").length;

    return `
      <article class="metric-card">
        <div class="summary-row">
          <div>
            <h4>${escapeHtml(signal.name)}</h4>
            <p class="muted">Match-level signal</p>
          </div>
          <label class="inline-toggle">
            <input type="checkbox" data-signal-presence-toggle="${signal.id}" ${whenPresent ? "checked" : ""} />
            <span class="inline-switch" aria-hidden="true"></span>
            <span class="inline-toggle-copy">When present</span>
          </label>
        </div>
        <p class="metric-value">${percent(wins, relevantMatches.length)} Winrate</p>
        <p class="muted">${relevantMatches.length} matches ${whenPresent ? "with" : "without"} this signal</p>
      </article>
    `;
  }

  const gameRows = matches.flatMap((match) => match.games);
  const presentGames = gameRows.filter((game) => game.signals?.[signal.id]);
  const absentGames = gameRows.filter((game) => !game.signals?.[signal.id]);
  const relevantGames = whenPresent ? presentGames : absentGames;
  const wins = relevantGames.filter((game) => game.winner === "me").length;

  return `
    <article class="metric-card">
      <div class="summary-row">
        <div>
          <h4>${escapeHtml(signal.name)}</h4>
          <p class="muted">Game-level signal</p>
        </div>
        <label class="inline-toggle">
          <input type="checkbox" data-signal-presence-toggle="${signal.id}" ${whenPresent ? "checked" : ""} />
          <span class="inline-switch" aria-hidden="true"></span>
          <span class="inline-toggle-copy">When present</span>
        </label>
      </div>
      <p class="metric-value">${percent(wins, relevantGames.length)} Winrate</p>
      <p class="muted">${relevantGames.length} games ${whenPresent ? "with" : "without"} this signal</p>
    </article>
  `;
}

function renderMatchDashboardBanner() {
  const dashboard = state.dashboards.find((item) => item.id === state.pendingMatchDashboardId);
  if (!dashboard || state.activeView !== "matches") {
    els.matchDashboardBanner.hidden = true;
    return;
  }

  els.matchDashboardBanner.hidden = false;
  els.matchDashboardBannerCopy.textContent = `This match will be added to ${dashboard.name}.`;
}

function renderMatchCard(match) {
  const wins = match.games.filter((game) => game.winner === "me").length;
  const losses = match.games.length - wins;
  const notes = match.notes ? escapeHtml(match.notes) : "No notes added.";
  const dashboardPills = (match.dashboardIds || [])
    .map((dashboardId) => state.dashboards.find((dashboard) => dashboard.id === dashboardId))
    .filter(Boolean)
    .map((dashboard) => `<span class="pill">${escapeHtml(dashboard.name)}</span>`)
    .join("");

  return `
    <article class="list-card">
      <div class="summary-row">
        <div>
          <h4>${match.winner === "me" ? "Match Win" : "Match Loss"}</h4>
          <p class="muted">${escapeHtml(match.date)}</p>
        </div>
        <div>
          <strong class="${match.winner === "me" ? "win" : "loss"}">${wins}-${losses}</strong>
          <div class="muted">games</div>
        </div>
      </div>
      <p class="muted">${notes}</p>
      <div class="pill-row">
        <span class="pill">${escapeHtml(match.matchType.toUpperCase())}</span>
        ${dashboardPills}
      </div>
    </article>
  `;
}

function refreshGameLabels() {
  Array.from(els.gamesContainer.children).forEach((card, index) => {
    const title = card.querySelector(".game-title");
    const coinflip = card.querySelector(".game-coinflip");
    title.textContent = `Game ${index + 1}`;
    coinflip.disabled = index !== 0;
    if (index !== 0) {
      coinflip.value = "";
    }
  });
}

function createCheckboxCard({ name, title, description }) {
  const wrapper = document.createElement("label");
  wrapper.className = "checkbox-card";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = name;

  const copy = document.createElement("div");
  copy.className = "checkbox-copy";
  copy.innerHTML = `<strong>${escapeHtml(title)}</strong><div class="muted">${escapeHtml(description)}</div>`;

  wrapper.append(checkbox, copy);
  return wrapper;
}

function statChip(label, value) {
  return `
    <article class="stat-chip">
      <span class="muted">${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function percent(wins, total) {
  if (!total) {
    return "0%";
  }
  return `${Math.round((wins / total) * 100)}%`;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function showAppError(message) {
  els.heroStats.innerHTML = statChip("Status", "Offline");
  const errorState = emptyState(message);
  els.overviewDashboardList.innerHTML = errorState;
  els.dashboardHighlights.innerHTML = errorState;
  els.signalList.innerHTML = errorState;
  els.dashboardDirectory.innerHTML = errorState;
  els.overviewDashboardHero.innerHTML = errorState;
  els.matchList.innerHTML = errorState;
  els.matchSignalFields.innerHTML = errorState;
  els.dashboardSignalPicker.innerHTML = errorState;
  els.dashboardDetailMetrics.innerHTML = errorState;
  els.dashboardDetailMatches.innerHTML = errorState;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.startsWith("/api/auth/")) showAuthShell();
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
