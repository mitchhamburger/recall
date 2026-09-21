<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MatchCard from "../components/MatchCard.vue";
import { recallStore } from "../store.js";
import { dashboardSummary, matchesForDashboard, percent } from "../utils/metrics.js";

const route = useRoute();
const router = useRouter();
const presence = reactive({});
const signalForm = reactive({ name: "", scope: "game", description: "" });
const savingSignal = ref(false);
const signalError = ref("");
const signalScope = ref("all");
const expandedSignalId = ref(null);
const dashboard = computed(() => recallStore.state.dashboards.find((item) => item.id === route.params.id));
const matches = computed(() => (dashboard.value ? matchesForDashboard(dashboard.value, recallStore.state.matches) : []));
const summary = computed(() => (dashboard.value ? dashboardSummary(dashboard.value, recallStore.state.matches) : null));
const universalSignals = computed(() => recallStore.state.signals.filter((signal) => !signal.dashboardId));
const localSignals = computed(() =>
  recallStore.state.signals.filter((signal) => signal.dashboardId === dashboard.value?.id),
);
const dashboardSignals = computed(() => [...universalSignals.value, ...localSignals.value]);
const filteredSignals = computed(() =>
  signalScope.value === "all"
    ? dashboardSignals.value
    : dashboardSignals.value.filter((signal) => signal.scope === signalScope.value),
);

function signalMetric(signal) {
  return signalMetricFor(signal, presence[signal.id] ?? true);
}

function signalMetricFor(signal, whenPresent) {
  if (signal.scope === "match") {
    const relevant = matches.value.filter((match) => Boolean(match.signals?.[signal.id]) === whenPresent);
    const wins = relevant.filter((match) => match.winner === "me").length;
    return {
      rate: percent(wins, relevant.length),
      ratePercent: relevant.length ? Math.round((wins / relevant.length) * 100) : 0,
      count: relevant.length,
      unit: "matches",
      whenPresent,
    };
  }
  const games = matches.value.flatMap((match) => match.games);
  const relevant = games.filter((game) => Boolean(game.signals?.[signal.id]) === whenPresent);
  const wins = relevant.filter((game) => game.winner === "me").length;
  return {
    rate: percent(wins, relevant.length),
    ratePercent: relevant.length ? Math.round((wins / relevant.length) * 100) : 0,
    count: relevant.length,
    unit: "games",
    whenPresent,
  };
}

async function removeDashboard() {
  if (!dashboard.value || !window.confirm(`Delete dashboard "${dashboard.value.name}"? Matches will remain logged.`)) return;
  await recallStore.deleteDashboard(dashboard.value.id);
  await router.push({ name: "dashboards" });
}

async function addDashboardSignal() {
  if (!dashboard.value) return;
  savingSignal.value = true;
  signalError.value = "";
  try {
    await recallStore.createDashboardSignal(dashboard.value.id, {
      name: signalForm.name.trim(),
      scope: signalForm.scope,
      description: signalForm.description.trim(),
    });
    Object.assign(signalForm, { name: "", scope: "game", description: "" });
  } catch (caught) {
    signalError.value = caught.message;
  } finally {
    savingSignal.value = false;
  }
}
</script>

<template>
  <div v-if="!dashboard" class="panel empty-state">
    Dashboard not found. <RouterLink :to="{ name: 'dashboards' }">Return to dashboards</RouterLink>.
  </div>
  <div v-else class="panel-grid">
    <article class="panel">
      <div class="panel-header dashboard-detail-header">
        <div><p class="eyebrow">Dashboard</p><h3>{{ dashboard.name }}</h3></div>
        <div class="inline-actions">
          <RouterLink :to="{ name: 'matches', query: { dashboard: dashboard.id } }" class="button secondary">Log Match Here</RouterLink>
          <button type="button" class="ghost danger-button" @click="removeDashboard">Delete Dashboard</button>
          <RouterLink :to="{ name: 'dashboards' }" class="button ghost">Back</RouterLink>
        </div>
      </div>
      <p class="muted">{{ matches.length }} matches assigned to this dashboard.</p>

      <section class="subpanel dashboard-signal-manager">
        <div class="subpanel-header">
          <div><p class="eyebrow">Dashboard Signals</p><h4>{{ localSignals.length }} specific to {{ dashboard.name }}</h4></div>
          <span class="pill">{{ universalSignals.length }} universal included</span>
        </div>
        <p class="muted">Add observations that only make sense for this deck or analysis. They won’t appear in other dashboards.</p>
        <p v-if="signalError" class="auth-message" role="alert">{{ signalError }}</p>
        <form class="signal-composer" @submit.prevent="addDashboardSignal">
          <label><span>Signal name</span><input v-model="signalForm.name" type="text" placeholder="Resolved my key threat" required /></label>
          <label><span>Scope</span><select v-model="signalForm.scope"><option value="game">Game</option><option value="match">Match</option></select></label>
          <label class="full-width"><span>Description <small>(optional)</small></span><input v-model="signalForm.description" type="text" placeholder="When should this be checked?" /></label>
          <button type="submit" class="secondary" :disabled="savingSignal">{{ savingSignal ? "Adding…" : "Add To This Dashboard" }}</button>
        </form>
        <div v-if="localSignals.length" class="pill-row">
          <span v-for="signal in localSignals" :key="signal.id" class="pill">{{ signal.name }} · {{ signal.scope }}</span>
        </div>
      </section>

      <div class="metric-grid">
        <article class="metric-card"><h4>Match Win Rate</h4><p class="metric-value">{{ summary.winRateLabel }}</p><p class="muted">{{ summary.matchWins }}/{{ summary.matchesPlayed }} matches</p></article>
        <article class="metric-card"><h4>Game Win Rate</h4><p class="metric-value">{{ summary.gameWinRateLabel }}</p><p class="muted">{{ summary.gameWins }}/{{ summary.totalGames }} games</p></article>
      </div>

      <div v-if="!dashboardSignals.length" class="empty-state">Add a dashboard signal or create a universal signal to see conditional win rates.</div>
      <template v-else>
        <div class="analysis-toolbar">
          <div>
            <p class="eyebrow">Signal Lab</p>
            <h4>Explore Conditional Win Rates</h4>
          </div>
          <div class="segmented-control" aria-label="Signal scope filter">
            <button
              v-for="option in ['all', 'match', 'game']"
              :key="option"
              type="button"
              :class="{ active: signalScope === option }"
              @click="signalScope = option"
            >
              {{ option[0].toUpperCase() + option.slice(1) }}
            </button>
          </div>
        </div>
        <TransitionGroup name="card-list" tag="div" class="stack signal-metrics">
        <article
          v-for="signal in filteredSignals"
          :key="signal.id"
          class="metric-card signal-metric-card"
          :class="{ expanded: expandedSignalId === signal.id }"
        >
          <div class="summary-row">
            <div>
              <h4>{{ signal.name }}</h4>
              <p class="muted">{{ signal.scope === 'match' ? 'Match' : 'Game' }} level · {{ signal.dashboardId ? 'Dashboard specific' : 'Universal' }}</p>
            </div>
            <div class="signal-card-actions">
              <label class="inline-toggle">
                <input
                  type="checkbox"
                  :checked="presence[signal.id] ?? true"
                  @change="presence[signal.id] = $event.target.checked"
                />
                <span class="inline-switch" aria-hidden="true"></span>
                <span class="inline-toggle-copy">{{ (presence[signal.id] ?? true) ? "Present" : "Absent" }}</span>
              </label>
              <button
                type="button"
                class="ghost compact-button"
                :aria-expanded="expandedSignalId === signal.id"
                @click="expandedSignalId = expandedSignalId === signal.id ? null : signal.id"
              >
                {{ expandedSignalId === signal.id ? "Hide comparison" : "Compare" }}
              </button>
            </div>
          </div>
          <p class="metric-value">{{ signalMetric(signal).rate }} Winrate</p>
          <p class="muted">{{ signalMetric(signal).count }} {{ signalMetric(signal).unit }} {{ signalMetric(signal).whenPresent ? 'with' : 'without' }} this signal</p>
          <div v-if="expandedSignalId === signal.id" class="comparison-grid">
            <div v-for="condition in [true, false]" :key="String(condition)" class="comparison-row">
              <div class="comparison-label">
                <strong>{{ condition ? "Present" : "Absent" }}</strong>
                <span class="muted">{{ signalMetricFor(signal, condition).count }} {{ signalMetricFor(signal, condition).unit }}</span>
              </div>
              <div class="comparison-track">
                <span :style="{ width: `${signalMetricFor(signal, condition).ratePercent}%` }"></span>
              </div>
              <strong>{{ signalMetricFor(signal, condition).rate }}</strong>
            </div>
          </div>
        </article>
        </TransitionGroup>
      </template>
    </article>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Membership</p><h3>Matches In This Dashboard</h3></div></div>
      <div v-if="!matches.length" class="empty-state">No matches assigned to this dashboard yet.</div>
      <div v-else class="stack"><MatchCard v-for="match in matches" :key="match.id" :match="match" /></div>
    </article>
  </div>
</template>
