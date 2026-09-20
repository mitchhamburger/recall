<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import DashboardCard from "../components/DashboardCard.vue";
import { recallStore } from "../store.js";
import { dashboardSummary } from "../utils/metrics.js";

const router = useRouter();
const form = reactive({ name: "", signalIds: [] });
const saving = ref(false);
const error = ref("");
const summaries = computed(() =>
  recallStore.state.dashboards.map((dashboard) => dashboardSummary(dashboard, recallStore.state.matches)),
);

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const dashboard = await recallStore.createDashboard({ name: form.name.trim(), signalIds: form.signalIds });
    form.name = "";
    form.signalIds = [];
    await router.push({ name: "dashboard-detail", params: { id: dashboard.id } });
  } catch (caught) {
    error.value = caught.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="panel-grid">
    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Views</p><h3>Dashboards</h3></div></div>
      <div v-if="!summaries.length" class="empty-state">No dashboards created yet.</div>
      <div v-else class="dashboard-list-grid">
        <DashboardCard v-for="summary in summaries" :key="summary.dashboard.id" :summary="summary" />
      </div>
    </article>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Config</p><h3>Create Dashboard</h3></div></div>
      <p v-if="error" class="auth-message" role="alert">{{ error }}</p>
      <form class="stack" @submit.prevent="submit">
        <label><span>Name</span><input v-model="form.name" type="text" placeholder="Temur Breach Testing" required /></label>
        <section class="subpanel">
          <div class="subpanel-header">
            <h4>Signals To Analyze</h4>
            <p>{{ form.signalIds.length }} selected · Choose the match or game signals this dashboard should highlight.</p>
          </div>
          <div v-if="!recallStore.state.signals.length" class="empty-state">Create signals first.</div>
          <div v-else class="checkbox-grid">
            <label v-for="signal in recallStore.state.signals" :key="signal.id" class="checkbox-card">
              <input v-model="form.signalIds" type="checkbox" :value="signal.id" />
              <span class="checkbox-copy"><strong>{{ signal.name }}</strong><span class="muted">{{ signal.scope }} signal</span></span>
            </label>
          </div>
        </section>
        <div class="form-actions"><button type="submit" :disabled="saving">{{ saving ? "Saving…" : "Save Dashboard" }}</button></div>
      </form>
    </article>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Flow</p><h3>How This Works</h3></div></div>
      <div class="empty-state">Create a dashboard, open it, and use its dedicated log button to add matches directly into that dashboard.</div>
    </article>
  </div>
</template>
