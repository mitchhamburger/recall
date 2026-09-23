<script setup>
defineProps({ summary: { type: Object, required: true }, detailed: { type: Boolean, default: false } });
</script>

<template>
  <RouterLink
    :to="{ name: 'dashboard-detail', params: { id: summary.dashboard.id } }"
    class="metric-card dashboard-summary-card clickable card-link"
  >
    <div class="dashboard-summary-head">
      <div>
        <h4>{{ summary.dashboard.name }}</h4>
        <p class="muted">{{ summary.matchesPlayed }} matches in this dashboard</p>
      </div>
      <span class="pill">{{ summary.winRateLabel }} Match WR</span>
    </div>
    <div v-if="detailed" class="dashboard-summary-stats">
      <div class="stat-block">
        <span class="muted">Match Win Rate</span>
        <strong>{{ summary.winRateLabel }}</strong>
      </div>
      <div class="stat-block">
        <span class="muted">Matches Won</span>
        <strong>{{ summary.matchWins }}/{{ summary.matchesPlayed }}</strong>
      </div>
      <div class="stat-block">
        <span class="muted">Games Won</span>
        <strong>{{ summary.gameWins }}/{{ summary.totalGames }}</strong>
      </div>
    </div>
    <div class="signal-bar">
      <div class="signal-bar-fill" :style="{ width: `${summary.winRatePercent}%` }"></div>
    </div>
  </RouterLink>
</template>
