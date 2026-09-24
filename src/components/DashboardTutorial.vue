<script setup>
import { computed, nextTick, ref } from "vue";

const emit = defineEmits(["create-dashboard"]);
const tutorialDialog = ref(null);
const stepIndex = ref(0);
const steps = [
  {
    icon: "▦",
    kicker: "Start focused",
    title: "A focused workspace for your testing plan.",
    description: "Use a dashboard to keep one deck, format, or matchup together, then explore multiple testing questions through its signals.",
    example: "Broodscale · Modern league testing",
  },
  {
    icon: "◇",
    kicker: "Choose signals",
    title: "Track the moments that may shape a result.",
    description: "Universal signals work everywhere. Dashboard signals capture observations unique to this deck or question.",
    example: "Had my key card by turn two",
  },
  {
    icon: "＋",
    kicker: "Build evidence",
    title: "Log matches inside the dashboard.",
    description: "Record each game from its dashboard, then compare match and game win rates as the evidence grows.",
    example: "8 matches · 63% match win rate",
  },
];
const step = computed(() => steps[stepIndex.value]);
const isLastStep = computed(() => stepIndex.value === steps.length - 1);

async function open() {
  stepIndex.value = 0;
  await nextTick();
  if (!tutorialDialog.value?.open) tutorialDialog.value?.showModal();
}

function close() {
  tutorialDialog.value?.close();
}

function next() {
  if (isLastStep.value) {
    close();
    emit("create-dashboard");
    return;
  }
  stepIndex.value += 1;
}

defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <dialog ref="tutorialDialog" class="match-log-dialog tutorial-dialog" aria-labelledby="tutorial-title">
      <article class="panel tutorial-modal">
        <div class="tutorial-header">
          <div>
            <p class="eyebrow">Dashboard Quick Start</p>
            <span class="tutorial-progress-copy">{{ stepIndex + 1 }} of {{ steps.length }}</span>
          </div>
          <button type="button" class="ghost modal-close" aria-label="Close dashboard tutorial" @click="close">×</button>
        </div>

        <div class="tutorial-progress" aria-label="Tutorial progress">
          <span v-for="(_, index) in steps" :key="index" :class="{ active: index <= stepIndex }"></span>
        </div>

        <Transition name="tutorial-step" mode="out-in">
          <section :key="stepIndex" class="tutorial-step">
            <div class="tutorial-visual" aria-hidden="true">
              <span class="tutorial-icon">{{ step.icon }}</span>
              <div class="tutorial-example">
                <small>Example</small>
                <strong>{{ step.example }}</strong>
              </div>
            </div>
            <div class="tutorial-copy">
              <p class="eyebrow">{{ step.kicker }}</p>
              <h3 id="tutorial-title">{{ step.title }}</h3>
              <p class="muted">{{ step.description }}</p>
            </div>
          </section>
        </Transition>

        <div class="tutorial-actions">
          <button v-if="stepIndex" type="button" class="ghost" @click="stepIndex -= 1">Back</button>
          <button v-else type="button" class="ghost" @click="close">Maybe Later</button>
          <button type="button" @click="next">{{ isLastStep ? "Create A Dashboard" : "Next" }}</button>
        </div>
      </article>
    </dialog>
  </Teleport>
</template>
