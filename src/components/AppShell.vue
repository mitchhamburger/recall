<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { recallStore } from "../store.js";

const route = useRoute();
const router = useRouter();
const theme = ref("ledger");
const navItems = [
  { name: "overview", label: "Overview" },
  { name: "matches", label: "Log Matches" },
  { name: "signals", label: "Signals" },
  { name: "dashboards", label: "Dashboards" },
];

const hero = computed(() => ({
  eyebrow: route.meta.eyebrow || "Recall",
  title: route.meta.title || "Track what matters.",
  description: route.meta.description || "",
}));

onMounted(() => {
  theme.value = localStorage.getItem("recall-theme") || "ledger";
  applyTheme(theme.value);
});

watch(theme, applyTheme);

function applyTheme(value) {
  document.body.dataset.theme = value;
  localStorage.setItem("recall-theme", value);
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
        <p class="eyebrow">MTG Stats Tracker</p>
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
          {{ item.label }}
        </RouterLink>
      </nav>

      <section class="sidebar-panel">
        <p class="eyebrow">Signed In</p>
        <p class="account-email">{{ recallStore.state.user?.email }}</p>
        <button type="button" class="ghost account-logout" @click="signOut">Sign Out</button>
      </section>

      <section class="sidebar-panel">
        <h2>Visual Style</h2>
        <div class="theme-picker">
          <button
            v-for="option in ['embers', 'ledger', 'nightfall']"
            :key="option"
            type="button"
            class="theme-button"
            :class="{ active: theme === option }"
            @click="theme = option"
          >
            {{ option[0].toUpperCase() + option.slice(1) }}
          </button>
        </div>
      </section>

      <section class="sidebar-panel">
        <h2>Quick Notes</h2>
        <ul class="compact-list">
          <li>Match signals apply once per match.</li>
          <li>Game signals can be checked separately for each game.</li>
          <li>Dashboard statistics only use matches assigned to that dashboard.</li>
        </ul>
      </section>
    </aside>

    <main class="main-content">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ hero.eyebrow }}</p>
          <h2>{{ hero.title }}</h2>
          <p class="muted">{{ hero.description }}</p>
        </div>
        <RouterLink v-if="route.name === 'overview'" :to="{ name: 'dashboards' }" class="button hero-action">
          Create Dashboard
        </RouterLink>
      </section>

      <p v-if="recallStore.state.error" class="auth-message" role="alert">
        {{ recallStore.state.error }}
      </p>
      <RouterView />
    </main>
  </div>
</template>
