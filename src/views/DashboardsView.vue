<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DashboardCard from "../components/DashboardCard.vue";
import { recallStore } from "../store.js";
import { dashboardSummary } from "../utils/metrics.js";

const router = useRouter();
const route = useRoute();
const dashboardDialog = ref(null);
const form = reactive({ name: "", signals: [] });
const signalDraft = reactive({ name: "", scope: "game", description: "" });
const saving = ref(false);
const error = ref("");
const summaries = computed(() =>
  recallStore.state.dashboards.map((dashboard) => dashboardSummary(dashboard, recallStore.state.matches)),
);
const hasDashboardDraft = computed(() => Boolean(form.name.trim() || form.signals.length || signalDraft.name.trim()));

watch(
  () => route.query.create,
  (value) => { if (value === "1") openDashboardCreator(); },
);

onMounted(() => {
  if (route.query.create === "1") openDashboardCreator();
});

async function openDashboardCreator() {
  await nextTick();
  if (!dashboardDialog.value?.open) dashboardDialog.value?.showModal();
}

function closeDashboardCreator() {
  dashboardDialog.value?.close();
}

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const dashboard = await recallStore.createDashboard({ name: form.name.trim(), signals: form.signals });
    form.name = "";
    form.signals = [];
    Object.assign(signalDraft, { name: "", scope: "game", description: "" });
    closeDashboardCreator();
    await router.push({ name: "dashboard-detail", params: { id: dashboard.id } });
  } catch (caught) {
    error.value = caught.message;
  } finally {
    saving.value = false;
  }
}

function addSignal() {
  const name = signalDraft.name.trim();
  if (!name) return;
  form.signals.push({ name, scope: signalDraft.scope, description: signalDraft.description.trim() });
  Object.assign(signalDraft, { name: "", scope: "game", description: "" });
}

function removeSignal(index) {
  form.signals.splice(index, 1);
}
</script>

<template>
  <div class="panel-grid">
    <article class="panel">
      <div class="panel-header dashboard-directory-header">
        <div><p class="eyebrow">Views</p><h3>Dashboards</h3></div>
        <div class="inline-actions">
          <span v-if="hasDashboardDraft" class="pill">Draft · {{ form.signals.length }} signals</span>
          <button type="button" @click="openDashboardCreator">{{ hasDashboardDraft ? "Continue Creating" : "Create Dashboard" }}</button>
        </div>
      </div>
      <div v-if="!summaries.length" class="empty-state">No dashboards created yet.</div>
      <div v-else class="dashboard-list-grid">
        <DashboardCard v-for="summary in summaries" :key="summary.dashboard.id" :summary="summary" />
      </div>
    </article>

    <Teleport to="body">
      <dialog ref="dashboardDialog" class="match-log-dialog dashboard-create-dialog" aria-labelledby="dashboard-create-title">
        <article class="panel match-log-modal dashboard-create-modal">
          <div class="panel-header modal-header">
            <div><p class="eyebrow">Guided Setup</p><h3 id="dashboard-create-title">Create Dashboard</h3></div>
            <div class="modal-actions">
              <span class="pill">{{ form.signals.length }} signals ready</span>
              <button type="button" class="ghost modal-close" aria-label="Close dashboard creator" @click="closeDashboardCreator">×</button>
            </div>
          </div>

          <p v-if="error" class="auth-message" role="alert">{{ error }}</p>
          <form class="stack dashboard-create-form" @submit.prevent="submit">
            <label><span>Dashboard name</span><input v-model="form.name" type="text" placeholder="Temur Breach Testing" required autofocus /></label>
            <section class="subpanel dashboard-signal-builder">
              <div class="subpanel-header">
                <div><p class="eyebrow">Dashboard Only</p><h4>Define Its Signals</h4></div>
                <p>Keep adding until this dashboard captures what matters.</p>
              </div>
              <p class="muted">These signals will exist only in this dashboard. Universal signals from the Signals tab remain available automatically.</p>

              <div class="signal-composer">
                <label><span>Signal name</span><input v-model="signalDraft.name" type="text" placeholder="Cast my dashboard's key card" @keydown.enter.prevent="addSignal" /></label>
                <label><span>Scope</span><select v-model="signalDraft.scope"><option value="game">Game</option><option value="match">Match</option></select></label>
                <label class="full-width"><span>Description <small>(optional)</small></span><input v-model="signalDraft.description" type="text" placeholder="When should this be checked?" /></label>
                <button type="button" class="secondary" :disabled="!signalDraft.name.trim()" @click="addSignal">Add Signal &amp; Continue</button>
              </div>

              <div v-if="!form.signals.length" class="empty-state">No dashboard signals staged yet. Add the first one above, or create the dashboard without local signals.</div>
              <div v-else class="stack staged-signal-list">
                <article v-for="(signal, index) in form.signals" :key="`${signal.name}-${index}`" class="list-card compact-list-card">
                  <div><strong>{{ signal.name }}</strong><p class="muted">{{ signal.scope }} · {{ signal.description || "No description" }}</p></div>
                  <button type="button" class="ghost compact-button" @click="removeSignal(index)">Remove</button>
                </article>
              </div>
            </section>
            <div class="guided-footer">
              <span class="muted">You can add more signals from the dashboard later.</span>
              <button type="submit" :disabled="saving">{{ saving ? "Creating…" : `Create Dashboard With ${form.signals.length} Signals` }}</button>
            </div>
          </form>
        </article>
      </dialog>
    </Teleport>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Flow</p><h3>How This Works</h3></div></div>
      <div class="empty-state">Universal signals appear everywhere. Signals created with a dashboard appear only when logging and analyzing matches for that dashboard.</div>
    </article>
  </div>
</template>
