<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { recallStore } from "../store.js";
import DashboardCreator from "./DashboardCreator.vue";
import DashboardTutorial from "./DashboardTutorial.vue";

const route = useRoute();
const router = useRouter();
const commandDialog = ref(null);
const commandSearch = ref(null);
const dashboardCreator = ref(null);
const dashboardTutorial = ref(null);
const commandQuery = ref("");
const activeCommandIndex = ref(0);
const universalSignalCount = computed(() => recallStore.state.signals.filter((signal) => !signal.dashboardId).length);
const navItems = [
  { name: "overview", label: "Home", icon: "⌂" },
  { name: "signals", label: "Signals", icon: "◇" },
  { name: "dashboards", label: "Dashboards", icon: "▦" },
];

const hero = computed(() => ({
  eyebrow: route.meta.eyebrow || "Recall",
  title: route.meta.title || "Track what matters.",
  description: route.meta.description || "",
}));
const commands = computed(() => [
  { label: "Create a dashboard", detail: "Start a focused analysis workspace", icon: "▦", action: openDashboardCreator },
  { label: "Manage universal signals", detail: `${universalSignalCount.value} reusable signals`, icon: "◇", to: { name: "signals" } },
  { label: "Open home", detail: "Compare dashboard performance", icon: "⌂", to: { name: "overview" } },
]);
const filteredCommands = computed(() => {
  const query = commandQuery.value.trim().toLowerCase();
  return query
    ? commands.value.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query))
    : commands.value;
});

watch(commandQuery, () => { activeCommandIndex.value = 0; });

onMounted(() => window.addEventListener("keydown", handleGlobalKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleGlobalKeydown));

provide("openDashboardCreator", openDashboardCreator);

function handleGlobalKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommands();
  }
}

async function openCommands() {
  commandQuery.value = "";
  activeCommandIndex.value = 0;
  if (!commandDialog.value?.open) commandDialog.value?.showModal();
  await nextTick();
  commandSearch.value?.focus();
}

function closeCommands() {
  commandDialog.value?.close();
}

function openDashboardCreator() {
  dashboardCreator.value?.open();
}

function openDashboardTutorial() {
  dashboardTutorial.value?.open();
}

function moveCommand(direction) {
  if (!filteredCommands.value.length) return;
  activeCommandIndex.value = (activeCommandIndex.value + direction + filteredCommands.value.length) % filteredCommands.value.length;
}

async function runCommand(command = filteredCommands.value[activeCommandIndex.value]) {
  if (!command) return;
  closeCommands();
  if (command.action) command.action();
  else await router.push(command.to);
}

async function signOut() {
  await recallStore.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <p class="eyebrow">TCG Stats Tracker</p>
        <h1>Recall</h1>
        <p class="brand-copy">Log matches, define signals, and inspect what actually correlates with wins.</p>
      </div>

      <nav class="nav" aria-label="Primary navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-button"
          :class="{
            active:
              route.name === item.name ||
              (item.name === 'dashboards' && route.name === 'dashboard-detail'),
          }"
        >
          <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <section class="sidebar-panel">
        <p class="eyebrow">Signed In</p>
        <p class="account-email">{{ recallStore.state.user?.email }}</p>
        <button type="button" class="ghost account-logout" @click="signOut">Sign Out</button>
      </section>

    </aside>

    <main class="main-content">
      <div class="workspace-bar">
        <div class="breadcrumb"><span>Recall</span><strong>/</strong><span>{{ hero.eyebrow }}</span></div>
        <div class="workspace-actions">
          <button type="button" class="ghost command-trigger" @click="openCommands">
            Quick actions <kbd>⌘ K</kbd>
          </button>
        </div>
      </div>

      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ hero.eyebrow }}</p>
          <h2>{{ hero.title }}</h2>
          <p class="muted">{{ hero.description }}</p>
        </div>
        <button v-if="route.name === 'overview'" type="button" class="hero-action" @click="openDashboardTutorial">
          How Dashboards Work
        </button>
      </section>

      <p v-if="recallStore.state.error" class="auth-message" role="alert">
        {{ recallStore.state.error }}
      </p>
      <RouterView v-slot="{ Component }">
        <Transition name="route-view" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>

    <Teleport to="body">
      <dialog ref="commandDialog" class="command-dialog" aria-labelledby="command-title">
        <div class="command-shell">
          <div class="command-search-row">
            <span aria-hidden="true">⌕</span>
            <input
              ref="commandSearch"
              v-model="commandQuery"
              type="search"
              placeholder="Jump to an action…"
              aria-label="Search quick actions"
              @keydown.down.prevent="moveCommand(1)"
              @keydown.up.prevent="moveCommand(-1)"
              @keydown.enter.prevent="runCommand()"
            />
            <button type="button" class="ghost compact-button" aria-label="Close quick actions" @click="closeCommands">Esc</button>
          </div>
          <div class="command-heading"><span id="command-title">Quick actions</span><small>{{ filteredCommands.length }} available</small></div>
          <div v-if="filteredCommands.length" class="command-list">
            <button
              v-for="(command, index) in filteredCommands"
              :key="command.label"
              type="button"
              class="command-item"
              :class="{ active: activeCommandIndex === index }"
              @mouseenter="activeCommandIndex = index"
              @click="runCommand(command)"
            >
              <span class="command-icon">{{ command.icon }}</span>
              <span><strong>{{ command.label }}</strong><small>{{ command.detail }}</small></span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div v-else class="empty-state">No actions match that search.</div>
        </div>
      </dialog>
    </Teleport>

    <DashboardCreator ref="dashboardCreator" />
    <DashboardTutorial ref="dashboardTutorial" @create-dashboard="openDashboardCreator" />
  </div>
</template>
