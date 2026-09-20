import { createRouter, createWebHistory } from "vue-router";
import { recallStore } from "./store.js";
import AppShell from "./components/AppShell.vue";
import AuthView from "./views/AuthView.vue";
import DashboardDetailView from "./views/DashboardDetailView.vue";
import DashboardsView from "./views/DashboardsView.vue";
import MatchesView from "./views/MatchesView.vue";
import OverviewView from "./views/OverviewView.vue";
import SignalsView from "./views/SignalsView.vue";

const routes = [
  { path: "/login", name: "login", component: AuthView, props: { mode: "login" }, meta: { public: true } },
  {
    path: "/register",
    name: "register",
    component: AuthView,
    props: { mode: "register" },
    meta: { public: true },
  },
  {
    path: "/",
    component: AppShell,
    children: [
      {
        path: "",
        name: "overview",
        component: OverviewView,
        meta: {
          eyebrow: "Dashboard-first analysis",
          title: "Every statistic belongs to a dashboard.",
          description: "Assign matches to a dashboard to keep each deck, format, or testing question in its own view.",
        },
      },
      {
        path: "matches",
        name: "matches",
        component: MatchesView,
        meta: {
          eyebrow: "Match history",
          title: "Capture the result while the details are fresh.",
          description: "Log games and signals, then assign the match to the dashboard where it belongs.",
        },
      },
      {
        path: "signals",
        name: "signals",
        component: SignalsView,
        meta: {
          eyebrow: "Signal library",
          title: "Define the moments you want to measure.",
          description: "Create reusable match- and game-level observations for dashboard analysis.",
        },
      },
      {
        path: "dashboards",
        name: "dashboards",
        component: DashboardsView,
        meta: {
          eyebrow: "Analysis workspace",
          title: "Build a focused view for every question.",
          description: "Choose the signals that matter, then send relevant matches directly to that dashboard.",
        },
      },
      {
        path: "dashboards/:id",
        name: "dashboard-detail",
        component: DashboardDetailView,
        meta: {
          eyebrow: "Dashboard detail",
          title: "Inspect one dataset without the noise.",
          description: "Every result on this page comes only from matches assigned to this dashboard.",
        },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  await recallStore.checkSession();
  if (to.meta.public && recallStore.isAuthenticated.value) return { name: "overview" };
  if (!to.meta.public && !recallStore.isAuthenticated.value) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (!to.meta.public && !recallStore.state.dataLoaded && !recallStore.state.loading) {
    await recallStore.refresh();
  }
  return true;
});
