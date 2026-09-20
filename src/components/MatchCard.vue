<script setup>
import { computed } from "vue";
import { recallStore } from "../store.js";

const props = defineProps({ match: { type: Object, required: true } });
const wins = computed(() => props.match.games.filter((game) => game.winner === "me").length);
const losses = computed(() => props.match.games.length - wins.value);
const dashboards = computed(() =>
  (props.match.dashboardIds || [])
    .map((id) => recallStore.state.dashboards.find((dashboard) => dashboard.id === id))
    .filter(Boolean),
);
</script>

<template>
  <article class="list-card">
    <div class="summary-row">
      <div>
        <h4>{{ match.winner === "me" ? "Match Win" : "Match Loss" }}</h4>
        <p class="muted">{{ match.date }}</p>
      </div>
      <div>
        <strong :class="match.winner === 'me' ? 'win' : 'loss'">{{ wins }}-{{ losses }}</strong>
        <div class="muted">games</div>
      </div>
    </div>
    <p class="muted">{{ match.notes || "No notes added." }}</p>
    <div class="pill-row">
      <span class="pill">{{ match.matchType.toUpperCase() }}</span>
      <span v-if="match.openingRollWinner" class="pill">
        {{ match.openingRollWinner === "me" ? "Won" : "Lost" }} opening roll
      </span>
      <span v-for="dashboard in dashboards" :key="dashboard.id" class="pill">{{ dashboard.name }}</span>
    </div>
  </article>
</template>
