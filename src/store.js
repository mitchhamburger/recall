import { computed, reactive, readonly } from "vue";
import { apiRequest } from "./api.js";

const state = reactive({
  user: null,
  signals: [],
  dashboards: [],
  matches: [],
  ready: false,
  dataLoaded: false,
  loading: false,
  error: "",
});

async function checkSession() {
  if (state.ready) return state.user;
  state.error = "";
  try {
    const payload = await apiRequest("/api/auth/session");
    state.user = payload.user;
  } catch (error) {
    state.user = null;
    state.error = error.message;
  } finally {
    state.ready = true;
  }
  return state.user;
}

async function refresh() {
  if (!state.user) return;
  state.loading = true;
  state.error = "";
  try {
    const payload = await apiRequest("/api/bootstrap");
    state.signals = payload.signals;
    state.dashboards = payload.dashboards;
    state.matches = payload.matches;
    state.dataLoaded = true;
  } catch (error) {
    if (error.status === 401) state.user = null;
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
}

async function authenticate(mode, credentials) {
  state.error = "";
  const payload = await apiRequest(`/api/auth/${mode}`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  state.user = payload.user;
  await refresh();
  return payload.user;
}

async function logout() {
  await apiRequest("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.signals = [];
  state.dashboards = [];
  state.matches = [];
  state.dataLoaded = false;
}

async function createSignal(signal) {
  await apiRequest("/api/signals", { method: "POST", body: JSON.stringify(signal) });
  await refresh();
}

async function createDashboard(dashboard) {
  const created = await apiRequest("/api/dashboards", {
    method: "POST",
    body: JSON.stringify(dashboard),
  });
  await refresh();
  return created;
}

async function createDashboardSignal(dashboardId, signal) {
  await apiRequest(`/api/dashboards/${encodeURIComponent(dashboardId)}/signals`, {
    method: "POST",
    body: JSON.stringify(signal),
  });
  await refresh();
}

async function deleteDashboard(id) {
  await apiRequest(`/api/dashboards/${encodeURIComponent(id)}`, { method: "DELETE" });
  await refresh();
}

async function createMatch(match) {
  const created = await apiRequest("/api/matches", {
    method: "POST",
    body: JSON.stringify(match),
  });
  await refresh();
  return created;
}

export const recallStore = {
  state: readonly(state),
  isAuthenticated: computed(() => Boolean(state.user)),
  checkSession,
  refresh,
  login: (credentials) => authenticate("login", credentials),
  register: (credentials) => authenticate("register", credentials),
  logout,
  createSignal,
  createDashboard,
  createDashboardSignal,
  deleteDashboard,
  createMatch,
};
