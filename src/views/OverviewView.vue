<script setup>
import { computed, ref } from "vue";
import DashboardCard from "../components/DashboardCard.vue";
import { recallStore } from "../store.js";
import { dashboardSummary } from "../utils/metrics.js";

const summaries = computed(() =>
  recallStore.state.dashboards.map((dashboard) => dashboardSummary(dashboard, recallStore.state.matches)),
);
const query = ref("");
const activity = ref("all");
const sortBy = ref("matches");
const filteredSummaries = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  const filtered = summaries.value.filter((summary) => {
    const matchesQuery = !normalizedQuery || summary.dashboard.name.toLowerCase().includes(normalizedQuery);
    const matchesActivity =
      activity.value === "all" ||
      (activity.value === "active" && summary.matchesPlayed > 0) ||
      (activity.value === "empty" && summary.matchesPlayed === 0);
    return matchesQuery && matchesActivity;
  });
  return [...filtered].sort((a, b) => {
    if (sortBy.value === "winRate") return b.winRate - a.winRate;
    if (sortBy.value === "name") return a.dashboard.name.localeCompare(b.dashboard.name);
    return b.matchesPlayed - a.matchesPlayed;
  });
});
const mostPlayed = computed(() => [...summaries.value].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0]);
const bestMatchRate = computed(() =>
  [...summaries.value].filter((item) => item.matchesPlayed).sort((a, b) => b.winRate - a.winRate)[0],
);
const bestGameRate = computed(() =>
  [...summaries.value].filter((item) => item.totalGames).sort((a, b) => b.gameWinRate - a.gameWinRate)[0],
);
</script>

<template>
  <div class="panel-grid">
    <article class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Your Analysis</p>
          <h3>Dashboard Results</h3>
        </div>
      </div>
      <div v-if="summaries.length" class="view-controls">
        <label class="search-control">
          <span class="sr-only">Search dashboards</span>
          <input v-model="query" type="search" placeholder="Search dashboards…" />
        </label>
        <div class="segmented-control" aria-label="Dashboard activity filter">
          <button
            v-for="option in ['all', 'active', 'empty']"
            :key="option"
            type="button"
            :class="{ active: activity === option }"
            @click="activity = option"
          >
            {{ option[0].toUpperCase() + option.slice(1) }}
          </button>
        </div>
        <label class="sort-control">
          <span>Sort</span>
          <select v-model="sortBy">
            <option value="matches">Most matches</option>
            <option value="winRate">Best win rate</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div v-if="recallStore.state.loading" class="empty-state">Loading dashboard results…</div>
      <div v-else-if="!summaries.length" class="empty-state">
        No dashboard results yet. Create a dashboard, then log matches directly to it.
      </div>
      <div v-else-if="!filteredSummaries.length" class="empty-state">No dashboards match those controls.</div>
      <TransitionGroup v-else name="card-list" tag="div" class="metric-grid">
        <DashboardCard
          v-for="summary in filteredSummaries"
          :key="summary.dashboard.id"
          :summary="summary"
          detailed
        />
      </TransitionGroup>
    </article>

    <article class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Across Your Dashboards</p>
          <h3>Dashboard Standouts</h3>
        </div>
      </div>
      <div v-if="!summaries.length" class="empty-state">
        Highlights will appear after you create dashboards and assign matches to them.
      </div>
      <div v-else class="metric-grid">
        <article v-if="mostPlayed" class="metric-card">
          <h4>Most Played Dashboard</h4>
          <p class="metric-value">{{ mostPlayed.dashboard.name }}</p>
          <p class="muted">{{ mostPlayed.matchesPlayed }} matches logged</p>
        </article>
        <article v-if="bestMatchRate" class="metric-card">
          <h4>Best Current Win Rate</h4>
          <p class="metric-value">{{ bestMatchRate.winRateLabel }}</p>
          <p class="muted">{{ bestMatchRate.dashboard.name }} across {{ bestMatchRate.matchesPlayed }} matches</p>
        </article>
        <article v-if="bestGameRate" class="metric-card">
          <h4>Best Game Win Rate</h4>
          <p class="metric-value">{{ bestGameRate.gameWinRateLabel }}</p>
          <p class="muted">{{ bestGameRate.dashboard.name }} across {{ bestGameRate.totalGames }} games</p>
        </article>
      </div>
    </article>
  </div>
</template>
