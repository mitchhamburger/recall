<script setup>
import { computed, reactive, ref } from "vue";
import { recallStore } from "../store.js";

const form = reactive({ name: "", scope: "game", description: "" });
const saving = ref(false);
const error = ref("");
const query = ref("");
const scopeFilter = ref("all");
const universalSignals = computed(() => recallStore.state.signals.filter((signal) => !signal.dashboardId));
const filteredSignals = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  return universalSignals.value.filter(
    (signal) =>
      (scopeFilter.value === "all" || signal.scope === scopeFilter.value) &&
      (!normalizedQuery || `${signal.name} ${signal.description}`.toLowerCase().includes(normalizedQuery)),
  );
});

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    await recallStore.createSignal({ ...form, name: form.name.trim(), description: form.description.trim() });
    Object.assign(form, { name: "", scope: "game", description: "" });
  } catch (caught) {
    error.value = caught.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="panel-grid two-column">
    <article class="panel">
      <div class="panel-header">
        <div><p class="eyebrow">Universal Library</p><h3>Create Reusable Signal</h3></div>
      </div>
      <p class="muted">Universal signals are available whenever you log a match, regardless of dashboard.</p>
      <p v-if="error" class="auth-message" role="alert">{{ error }}</p>
      <form class="stack" @submit.prevent="submit">
        <label><span>Signal Name</span><input v-model="form.name" type="text" placeholder="I mulliganed twice" required /></label>
        <label>
          <span>Scope</span>
          <select v-model="form.scope"><option value="game">Game</option><option value="match">Match</option></select>
        </label>
        <label><span>Description</span><textarea v-model="form.description" rows="3" placeholder="Optional guidance for when to check this signal"></textarea></label>
        <div class="form-actions"><button type="submit" :disabled="saving">{{ saving ? "Saving…" : "Add Signal" }}</button></div>
      </form>
    </article>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">Reusable Everywhere</p><h3>Universal Signals</h3></div></div>
      <div v-if="universalSignals.length" class="view-controls signal-controls">
        <label class="search-control"><span class="sr-only">Search signals</span><input v-model="query" type="search" placeholder="Search signals…" /></label>
        <div class="segmented-control" aria-label="Signal scope filter">
          <button
            v-for="option in ['all', 'match', 'game']"
            :key="option"
            type="button"
            :class="{ active: scopeFilter === option }"
            @click="scopeFilter = option"
          >
            {{ option[0].toUpperCase() + option.slice(1) }}
          </button>
        </div>
      </div>
      <div v-if="!universalSignals.length" class="empty-state">No universal signals yet. Dashboard-specific signals are created inside each dashboard.</div>
      <div v-else-if="!filteredSignals.length" class="empty-state">No signals match those controls.</div>
      <TransitionGroup v-else name="card-list" tag="div" class="stack">
        <article v-for="signal in filteredSignals" :key="signal.id" class="list-card">
          <div class="summary-row"><h4>{{ signal.name }}</h4><span class="pill">{{ signal.scope }}</span></div>
          <p class="muted">{{ signal.description || "No description provided." }}</p>
        </article>
      </TransitionGroup>
    </article>
  </div>
</template>
