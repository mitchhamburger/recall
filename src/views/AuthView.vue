<script setup>
import { computed, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { recallStore } from "../store.js";

const props = defineProps({ mode: { type: String, required: true } });
const route = useRoute();
const router = useRouter();
const form = reactive({ email: "", password: "" });
const submitting = ref(false);
const error = ref("");
const isLogin = computed(() => props.mode === "login");
const displayError = computed(() => error.value || recallStore.state.error);

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    const action = isLogin.value ? recallStore.login : recallStore.register;
    await action({ email: form.email.trim(), password: form.password });
    const destination = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(destination);
  } catch (caught) {
    error.value = caught.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="auth-shell">
    <section class="auth-card">
      <div class="auth-brand">
        <p class="eyebrow">TCG Stats Tracker</p>
        <h1>Recall</h1>
        <p>Sign in to keep your dashboards, signals, and match history private.</p>
      </div>

      <div class="auth-tabs" role="tablist" aria-label="Account access">
        <RouterLink :to="{ name: 'login' }" class="auth-tab" :class="{ active: isLogin }">Sign In</RouterLink>
        <RouterLink :to="{ name: 'register' }" class="auth-tab" :class="{ active: !isLogin }">
          Create Account
        </RouterLink>
      </div>

      <p v-if="displayError" class="auth-message" role="alert">{{ displayError }}</p>

      <form class="stack auth-form" @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model="form.email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            :minlength="isLogin ? undefined : 8"
            required
          />
          <small v-if="!isLogin">Use at least 8 characters.</small>
        </label>
        <button type="submit" :disabled="submitting">
          {{ submitting ? "Please wait…" : isLogin ? "Sign In" : "Create Account" }}
        </button>
      </form>
    </section>
  </main>
</template>
