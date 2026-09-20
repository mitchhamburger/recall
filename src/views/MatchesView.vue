<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MatchCard from "../components/MatchCard.vue";
import { recallStore } from "../store.js";

const route = useRoute();
const router = useRouter();
const loggerDialog = ref(null);
const isLoggerOpen = ref(false);
const phase = ref("setup");
const saving = ref(false);
const error = ref("");
const setup = reactive({ gamesToWin: 2, openingRollWinner: "me", notes: "", signals: {} });
const completedGames = ref([]);
const currentGame = reactive(makeGame());

const matchSignals = computed(() => recallStore.state.signals.filter((signal) => signal.scope === "match"));
const openingRollSignal = computed(() =>
  matchSignals.value.find((signal) => signal.name.trim().toLowerCase() === "won the opening roll"),
);
const manualMatchSignals = computed(() =>
  matchSignals.value.filter((signal) => signal.id !== openingRollSignal.value?.id),
);
const gameSignals = computed(() => recallStore.state.signals.filter((signal) => signal.scope === "game"));
const selectedDashboard = computed(() =>
  recallStore.state.dashboards.find((dashboard) => dashboard.id === route.query.dashboard),
);
const matchType = computed(() => `bo${setup.gamesToWin * 2 - 1}`);
const score = computed(() => ({
  me: completedGames.value.filter((game) => game.winner === "me").length,
  opponent: completedGames.value.filter((game) => game.winner === "opponent").length,
}));
const matchComplete = computed(
  () => score.value.me >= setup.gamesToWin || score.value.opponent >= setup.gamesToWin,
);
const matchWinner = computed(() => (score.value.me >= setup.gamesToWin ? "me" : "opponent"));
const selectedGameSignalCount = computed(() => Object.values(currentGame.signals).filter(Boolean).length);

onMounted(() => {
  if (route.query.dashboard) openLogger();
});

async function openLogger() {
  isLoggerOpen.value = true;
  await nextTick();
  if (!loggerDialog.value?.open) loggerDialog.value?.showModal();
}

function closeLogger() {
  loggerDialog.value?.close();
  isLoggerOpen.value = false;
}

function makeGame(overrides = {}) {
  return { playerOnPlay: "me", openingHandSize: 7, winner: "me", signals: {}, ...overrides };
}

function startMatch() {
  error.value = "";
  completedGames.value = [];
  resetCurrentGame(setup.openingRollWinner);
  phase.value = "games";
}

function resetCurrentGame(playerOnPlay = "me") {
  Object.assign(currentGame, makeGame({ playerOnPlay }));
}

function submitGame() {
  error.value = "";
  const game = {
    playerOnPlay: currentGame.playerOnPlay,
    openingHandSize: Number(currentGame.openingHandSize),
    winner: currentGame.winner,
    coinflipWon: completedGames.value.length === 0 ? setup.openingRollWinner === "me" : null,
    signals: Object.fromEntries(
      gameSignals.value.map((signal) => [signal.id, Boolean(currentGame.signals[signal.id])]),
    ),
  };
  completedGames.value.push(game);
  if (!matchComplete.value) {
    const previousLoser = game.winner === "me" ? "opponent" : "me";
    resetCurrentGame(previousLoser);
  }
}

function undoLastGame() {
  const game = completedGames.value.pop();
  if (!game) return;
  Object.assign(currentGame, {
    playerOnPlay: game.playerOnPlay,
    openingHandSize: game.openingHandSize,
    winner: game.winner,
    signals: { ...game.signals },
  });
}

function restartSetup() {
  phase.value = "setup";
  completedGames.value = [];
  resetCurrentGame();
}

async function clearDashboard() {
  await router.replace({ name: "matches" });
}

async function saveMatch() {
  if (!matchComplete.value) return;
  saving.value = true;
  error.value = "";
  const dashboardId = selectedDashboard.value?.id;
  const signals = Object.fromEntries(
    matchSignals.value.map((signal) => [
      signal.id,
      signal.id === openingRollSignal.value?.id
        ? setup.openingRollWinner === "me"
        : Boolean(setup.signals[signal.id]),
    ]),
  );

  try {
    await recallStore.createMatch({
      matchType: matchType.value,
      openingRollWinner: setup.openingRollWinner,
      notes: setup.notes.trim(),
      signals,
      games: completedGames.value,
      dashboardIds: dashboardId ? [dashboardId] : [],
    });
    Object.assign(setup, { gamesToWin: 2, openingRollWinner: "me", notes: "", signals: {} });
    completedGames.value = [];
    resetCurrentGame();
    phase.value = "setup";
    closeLogger();
    if (dashboardId) await router.push({ name: "dashboard-detail", params: { id: dashboardId } });
  } catch (caught) {
    error.value = caught.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="panel-grid">
    <article class="panel match-launcher">
      <div>
        <p class="eyebrow">Guided Entry</p>
        <h3>{{ phase === "games" ? "Match In Progress" : "Ready For Your Next Match?" }}</h3>
        <p class="muted">
          {{ phase === "games"
            ? `Your ${matchType.toUpperCase()} draft is saved here at ${score.me}–${score.opponent}.`
            : "Record a match in a focused, step-by-step workspace." }}
        </p>
      </div>
      <div class="match-launcher-actions">
        <span v-if="phase === 'games'" class="pill">Game {{ completedGames.length + (matchComplete ? 0 : 1) }}</span>
        <button type="button" @click="openLogger">{{ phase === "games" ? "Resume Match" : "Log A Match" }}</button>
      </div>
    </article>

    <Teleport to="body">
      <dialog
        ref="loggerDialog"
        class="match-log-dialog"
        aria-labelledby="match-log-title"
        @close="isLoggerOpen = false"
        @cancel="isLoggerOpen = false"
      >
        <article class="panel guided-match-panel match-log-modal">
          <div class="panel-header modal-header">
            <div><p class="eyebrow">Guided Entry</p><h3 id="match-log-title">Log A Match</h3></div>
            <div class="modal-actions">
              <button v-if="phase === 'games'" type="button" class="ghost compact-button" @click="restartSetup">
                Start Over
              </button>
              <button type="button" class="ghost modal-close" aria-label="Close match logger" @click="closeLogger">×</button>
            </div>
          </div>

          <ol class="stepper" aria-label="Match logging progress">
        <li :class="{ active: phase === 'setup', complete: phase === 'games' }"><span>1</span><div><strong>Match setup</strong><small>Format and roll</small></div></li>
        <li :class="{ active: phase === 'games' && !matchComplete, complete: matchComplete }"><span>2</span><div><strong>Record games</strong><small>One at a time</small></div></li>
        <li :class="{ active: matchComplete }"><span>3</span><div><strong>Finish</strong><small>Review and save</small></div></li>
      </ol>

          <p v-if="error" class="auth-message" role="alert">{{ error }}</p>

          <div v-if="selectedDashboard" class="inline-banner">
        <div><strong>Dashboard destination</strong><p class="muted">This match will be added to {{ selectedDashboard.name }}.</p></div>
        <button v-if="phase === 'setup'" type="button" class="ghost" @click="clearDashboard">Clear</button>
      </div>

          <form v-if="phase === 'setup'" class="stack setup-flow" @submit.prevent="startMatch">
        <section class="guided-section">
          <div class="guided-section-copy">
            <span class="step-kicker">Step 1</span>
            <h4>How many games does it take to win?</h4>
            <p class="muted">Choose the match structure. We’ll stop as soon as either player reaches the target.</p>
          </div>
          <div class="choice-grid format-choice-grid">
            <label v-for="wins in [1, 2, 3]" :key="wins" class="choice-card" :class="{ selected: setup.gamesToWin === wins }">
              <input v-model="setup.gamesToWin" type="radio" name="games-to-win" :value="wins" />
              <strong>First to {{ wins }}</strong>
              <span>Best of {{ wins * 2 - 1 }}</span>
            </label>
          </div>
        </section>

        <section class="guided-section">
          <div class="guided-section-copy">
            <span class="step-kicker">Step 2</span>
            <h4>Who won the opening roll?</h4>
            <p class="muted">This is saved at the match level and sets the default for who plays first in game one.</p>
          </div>
          <div class="choice-grid two-choice-grid">
            <label class="choice-card" :class="{ selected: setup.openingRollWinner === 'me' }">
              <input v-model="setup.openingRollWinner" type="radio" name="opening-roll" value="me" />
              <strong>I won the roll</strong><span>Default me on the play</span>
            </label>
            <label class="choice-card" :class="{ selected: setup.openingRollWinner === 'opponent' }">
              <input v-model="setup.openingRollWinner" type="radio" name="opening-roll" value="opponent" />
              <strong>Opponent won</strong><span>Default opponent on the play</span>
            </label>
          </div>
        </section>

        <section v-if="manualMatchSignals.length" class="guided-section">
          <div class="guided-section-copy">
            <span class="step-kicker">Optional</span>
            <h4>Match-level signals</h4>
            <p class="muted">Opening-roll tracking is automatic. Check any other facts that apply to the whole match.</p>
          </div>
          <div class="checkbox-grid">
            <label v-for="signal in manualMatchSignals" :key="signal.id" class="checkbox-card">
              <input v-model="setup.signals[signal.id]" type="checkbox" />
              <span class="checkbox-copy"><strong>{{ signal.name }}</strong><span class="muted">{{ signal.description || "No description provided." }}</span></span>
            </label>
          </div>
        </section>

        <label><span>Match notes <small>(optional)</small></span><textarea v-model="setup.notes" rows="3" placeholder="Opponent, deck, event, or anything worth remembering"></textarea></label>

        <div class="guided-footer">
          <div><strong>{{ matchType.toUpperCase() }}</strong><span class="muted"> · {{ setup.openingRollWinner === 'me' ? 'You' : 'Opponent' }} won the roll</span></div>
          <button type="submit">Start Match</button>
        </div>
          </form>

          <div v-else class="stack game-flow">
        <section class="match-scoreboard" aria-live="polite">
          <div class="scoreboard-status">
            <p class="eyebrow">{{ matchComplete ? "Match Complete" : `Game ${completedGames.length + 1}` }}</p>
            <strong :class="matchComplete ? (matchWinner === 'me' ? 'win' : 'loss') : ''">
              {{ matchComplete ? (matchWinner === 'me' ? "You won the match" : "Opponent won the match") : `First to ${setup.gamesToWin}` }}
            </strong>
          </div>
          <div class="score-side"><span>You</span><strong>{{ score.me }}</strong></div>
          <div class="score-divider">–</div>
          <div class="score-side"><span>Opponent</span><strong>{{ score.opponent }}</strong></div>
          <div class="scoreboard-meta">
            <span>{{ matchType.toUpperCase() }}</span>
            <span>{{ setup.openingRollWinner === 'me' ? 'You won' : 'Opponent won' }} the roll</span>
            <span>{{ selectedDashboard?.name || "History only" }}</span>
          </div>
        </section>

        <div v-if="completedGames.length" class="game-timeline">
          <span
            v-for="(game, index) in completedGames"
            :key="index"
            class="game-result-chip"
            :class="game.winner === 'me' ? 'won' : 'lost'"
            :title="`Game ${index + 1}: ${game.winner === 'me' ? 'win' : 'loss'}`"
          >
            <span>G{{ index + 1 }}</span><strong>{{ game.winner === "me" ? "W" : "L" }}</strong>
          </span>
          <button type="button" class="ghost compact-button" @click="undoLastGame">Undo last game</button>
        </div>

        <form v-if="!matchComplete" class="game-entry-card" @submit.prevent="submitGame">
          <div class="game-entry-heading">
            <div><p class="eyebrow">Now Recording</p><h4>Game {{ completedGames.length + 1 }}</h4></div>
            <span class="pill">{{ selectedGameSignalCount }} signals checked</span>
          </div>

          <div class="form-grid">
            <label><span>Who played first?</span><select v-model="currentGame.playerOnPlay"><option value="me">I did</option><option value="opponent">Opponent did</option></select></label>
            <label><span>Opening hand kept</span><select v-model="currentGame.openingHandSize"><option :value="7">7 cards</option><option :value="6">6 cards</option><option :value="5">5 cards</option><option :value="4">4 or fewer</option></select></label>
          </div>

          <fieldset class="winner-picker">
            <legend>Who won this game?</legend>
            <div class="choice-grid two-choice-grid">
              <label class="choice-card compact" :class="{ selected: currentGame.winner === 'me' }"><input v-model="currentGame.winner" type="radio" value="me" /><strong>I won</strong></label>
              <label class="choice-card compact" :class="{ selected: currentGame.winner === 'opponent' }"><input v-model="currentGame.winner" type="radio" value="opponent" /><strong>Opponent won</strong></label>
            </div>
          </fieldset>

          <section>
            <div class="subpanel-header"><h4>What happened this game?</h4><p>These selections reset after you submit the game.</p></div>
            <div v-if="!gameSignals.length" class="empty-state">No game-level signals yet.</div>
            <div v-else class="checkbox-grid game-signal-grid">
              <label v-for="signal in gameSignals" :key="signal.id" class="checkbox-card">
                <input v-model="currentGame.signals[signal.id]" type="checkbox" />
                <span class="checkbox-copy"><strong>{{ signal.name }}</strong><span class="muted">{{ signal.description || "No description provided." }}</span></span>
              </label>
            </div>
          </section>

          <div class="guided-footer">
            <span class="muted">Submitting clears this game and advances the scoreboard.</span>
            <button type="submit">Submit Game {{ completedGames.length + 1 }}</button>
          </div>
        </form>

        <section v-else class="match-complete-card">
          <div class="completion-mark" :class="matchWinner === 'me' ? 'win' : 'loss'">{{ matchWinner === "me" ? "W" : "L" }}</div>
          <div><p class="eyebrow">Ready To Save</p><h4>{{ score.me }}–{{ score.opponent }} final score</h4><p class="muted">Review the game chips above or undo the last game before saving.</p></div>
          <button type="button" :disabled="saving" @click="saveMatch">{{ saving ? "Saving…" : "Save Completed Match" }}</button>
        </section>
          </div>
        </article>
      </dialog>
    </Teleport>

    <article class="panel">
      <div class="panel-header"><div><p class="eyebrow">History</p><h3>All Logged Matches</h3></div></div>
      <div v-if="!recallStore.state.matches.length" class="empty-state">No matches logged yet.</div>
      <div v-else class="stack"><MatchCard v-for="match in recallStore.state.matches" :key="match.id" :match="match" /></div>
    </article>
  </div>
</template>
