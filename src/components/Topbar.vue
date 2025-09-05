<template>
  <header class="topbar">
    <div class="row" style="align-items:center; gap:.6rem;">
      <div class="tag">ToEAI</div>
      <!-- Preserve the original GitHub page title so the look and feel remain similar -->
      <div class="topbar__title">AI Music Chat</div>
    </div>
    <div class="topbar__right">
      <button class="button ghost" @click="$emit('open-login')" aria-label="Login or account">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5.33 0-8 2.67-8 8h2c0-4.2 2.1-6 6-6s6 1.8 6 6h2c0-5.33-2.67-8-8-8Z" fill="currentColor" />
        </svg>
        Account
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Simple Topbar.  Emits an event when the user wants to open the login modal.
defineEmits<{
  (e: 'open-login'): void
}>()
</script>