<script setup>
import { computed, inject } from "vue";
import DashboardCard from "../components/DashboardCard.vue";
import { recallStore } from "../store.js";
import { dashboardSummary } from "../utils/metrics.js";

const openDashboardCreator = inject("openDashboardCreator");
const summaries = computed(() =>
  recallStore.state.dashboards.map((dashboard) => dashboardSummary(dashboard, recallStore.state.matches)),
);
</script>

<template>
  <div class="panel-grid">
    <article class="panel">
      <div class="panel-header dashboard-directory-header">
        <div><p class="eyebrow">Views</p><h3>Dashboards</h3></div>
        <button type="button" @click="openDashboardCreator">Create Dashboard</button>
      </div>
      <div v-if="!summaries.length" class="empty-state">No dashboards created yet.</div>
      <div v-else class="dashboard-list-grid">
        <DashboardCard v-for="summary in summaries" :key="summary.dashboard.id" :summary="summary" />
      </div>
    </article>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Flow</p><h3>How This Works</h3></div></div>
      <div class="empty-state">Universal signals appear everywhere. Signals created with a dashboard appear only when logging and analyzing matches for that dashboard.</div>
    </article>
  </div>
</template>
