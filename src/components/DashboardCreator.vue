<script setup>
import { computed, nextTick, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { recallStore } from "../store.js";

const router = useRouter();
const dashboardDialog = ref(null);
const form = reactive({ name: "", signals: [] });
const signalDraft = reactive({ name: "", scope: "game", description: "" });
const saving = ref(false);
const error = ref("");
const hasDraft = computed(() => Boolean(form.name.trim() || form.signals.length || signalDraft.name.trim()));

async function open() {
  await nextTick();
  if (!dashboardDialog.value?.open) dashboardDialog.value?.showModal();
}

function close() {
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
    close();
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

defineExpose({ open, hasDraft });
</script>

<template>
  <Teleport to="body">
    <dialog ref="dashboardDialog" class="match-log-dialog dashboard-create-dialog" aria-labelledby="dashboard-create-title">
      <article class="panel match-log-modal dashboard-create-modal">
        <div class="panel-header modal-header">
          <div><p class="eyebrow">Guided Setup</p><h3 id="dashboard-create-title">Create Dashboard</h3></div>
          <div class="modal-actions">
            <span class="pill">{{ form.signals.length }} signals ready</span>
            <button type="button" class="ghost modal-close" aria-label="Close dashboard creator" @click="close">×</button>
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
</template>
