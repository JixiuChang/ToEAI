<template>
  <aside class="sidebar">
    <div class="sidebar__head">
      <!-- New Chat button -->
      <button class="button primary" @click="onNewChat">+ New Chat</button>
      <!-- Current user tag -->
      <div class="tag">{{ currentUser }}</div>
    </div>
    <div class="separator"></div>
    <!-- Conversations list -->
    <div class="sidebar__list">
      <div v-if="sessions.length === 0" class="chat__empty" style="padding:1.25rem;">
        <div>No chats yet. Start a new one.</div>
      </div>
      <div
        v-for="s in sessions"
        :key="s.id"
        :class="['sidebar__item', { active: s.id === activeId }]"
        @click="setActive(s.id)"
      >
        <div>
          <div style="font-weight:600;">{{ s.title }}</div>
          <small>{{ formatTime(s.updatedAt) }}</small>
        </div>
        <div class="row">
          <button class="button ghost" title="Rename" @click.stop="rename(s)">Rename</button>
          <button class="button ghost danger" title="Delete" @click.stop="remove(s.id)">Delete</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { state, currentSessions, newSession, setActiveSession, deleteSession, renameSession } from '../store'

// Emit an event when the user creates a new chat.  The parent can use this
// to reset the chat pane.
const emit = defineEmits<{ (e:'new-chat'): void }>()

const currentUser = computed(() => state.currentUser)
const sessions = currentSessions
const activeId = computed(() => state.activeSessionId)

function onNewChat() {
  // Create a new session in the central store so it appears in the history list
  newSession()
  // Notify the parent (App.vue) so that the Chat component can reset its thread
  emit('new-chat')
}

function setActive(id: string) {
  setActiveSession(id)
}

function remove(id: string) {
  // Delete the session in the store
  deleteSession(id)
  // Also signal that a new chat should be created in the chat pane.  This
  // ensures that the right-hand side clears out when the last session is
  // removed, and a new placeholder conversation is started.
  emit('new-chat')
}

function rename(s: { id: string; title: string }) {
  const t = prompt('Rename chat', s.title)
  if (t !== null) renameSession(s.id, t)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}
</script>