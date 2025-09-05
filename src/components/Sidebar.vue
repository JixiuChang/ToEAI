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

const currentUser = computed(() => state.currentUser)
const sessions = currentSessions
const activeId = computed(() => state.activeSessionId)

function onNewChat() {
  newSession()
}

function setActive(id: string) {
  setActiveSession(id)
}

function remove(id: string) {
  deleteSession(id)
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