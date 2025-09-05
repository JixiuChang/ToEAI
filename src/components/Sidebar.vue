<template>
  <!-- Mobile overlay -->
  <div v-if="mobileOpen" class="overlay" @click="$emit('close-mobile')"></div>

  <aside class="sidebar" :class="{ open: mobileOpen }" @click.stop>
    <!-- Header -->
    <div class="head">
      <div class="logo-row">
        <div class="dot"></div>
        <strong>Chats</strong>
      </div>
    </div>

    <!-- New chat (full width, top) -->
    <button class="new-chat" @click="$emit('new')" title="New chat">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      New chat
    </button>

    <!-- Conversations (compact list) -->
    <ul class="list">
      <li
        v-for="c in sorted"
        :key="c.id"
        :class="['item', { active: c.id === activeId }]"
        @click="$emit('open', c.id)"
        :title="c.title"
      >
        <svg class="file-ico" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 4h7l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.6"/>
        </svg>
        <span class="title">{{ c.title || 'Untitled' }}</span>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
type Conv = { id: string; title: string; updatedAt: number }

const props = defineProps<{
  conversations: Conv[],
  activeId: string | null,
  mobileOpen?: boolean
}>()

defineEmits<{
  (e:'new'): void
  (e:'open', id: string): void
  (e:'close-mobile'): void
}>()

const sorted = computed(() => [...props.conversations].sort((a,b)=>b.updatedAt - a.updatedAt))
const mobileOpen = computed(() => props.mobileOpen === true)
</script>

<style scoped>
/* Uses global sidebar styles from style.css; only minimal component-specific tweaks here if needed */
</style>
