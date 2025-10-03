<template>
  <div class="layout">
    <!-- LEFT: Sidebar -->
    <Sidebar
      v-model:libraryOpen="libraryOpen"
      :sessions="sessions"
      :library="libraryItems"
      :active-id="activeId"
      @create="handleCreateChat"
      @select="handleSelectChat"
      @play="handlePlayAudio"
      @rename="renameChat"
      @archive="archiveChat"
      @delete="deleteChat"
    />

    <!-- RIGHT: Chat panel -->
    <Chat
      :is-logged-in="isLoggedIn"
      @openTool="openTool"
      @openLogin="showLogin = true"
      @logout="handleLogout"
    />
  </div>

  <!-- Login modal -->
  <LoginModal
    v-if="showLogin"
    @close="showLogin = false"
    @success="handleLoginSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Chat from './components/Chat.vue';
import LoginModal from './components/LoginModal.vue';

type SessionItem = { id: string; title: string; updatedAt: string | number | Date; };
type LibraryItem = { id: string; title: string; meta?: string; };

/** Initial: ONE "New Chat" (no number) */
const sessions = ref<SessionItem[]>([
  { id: 'seed-1', title: 'New Chat', updatedAt: new Date().toISOString() }
]);
const activeId = ref<string>('seed-1');

const libraryOpen = ref(false);
const libraryItems = ref<LibraryItem[]>([]);

const isLoggedIn = ref(false);
const showLogin = ref(false);

/** Sidebar events */
function handleCreateChat() {
  // Close Music Library IF it's open (per request)
  if (libraryOpen.value) libraryOpen.value = false;

  const id = crypto?.randomUUID ? crypto.randomUUID() : `c_${Date.now().toString(36)}`;
  const title = nextChatTitle();

  const chat: SessionItem = { id, title, updatedAt: new Date().toISOString() };
  sessions.value.unshift(chat);
  activeId.value = id;
}
function nextChatTitle(): string {
  const base = 'New Chat';
  const count = sessions.value.filter(s => s.title.startsWith(base)).length;
  return count === 0 ? base : `${base} ${count + 1}`;
}
function handleSelectChat(id: string) { activeId.value = id; }
function handlePlayAudio(id: string) { console.log('Play audio item:', id); }

/** Row menu handlers */
function renameChat(id: string) {
  const s = sessions.value.find(x => x.id === id);
  if (!s) return;
  const name = window.prompt('Rename chat', s.title);
  if (name && name.trim()) { s.title = name.trim(); }
}
function archiveChat(id: string) {
  const s = sessions.value.find(x => x.id === id);
  if (!s) return;
  // simple archive: prefix title; you can move to a different list if needed
  if (!s.title.startsWith('[Archived] ')) s.title = `[Archived] ${s.title}`;
}
function deleteChat(id: string) {
  const idx = sessions.value.findIndex(x => x.id === id);
  if (idx === -1) return;
  sessions.value.splice(idx, 1);
  if (activeId.value === id) activeId.value = sessions.value[0]?.id;
}

/** Top-bar actions from Chat */
function openTool(tool: 'stems' | 'chords' | 'analysis') { console.log('Open tool:', tool); }
function handleLoginSuccess() { isLoggedIn.value = true; showLogin.value = false; }
function handleLogout() { isLoggedIn.value = false; }
</script>

<style>
/* No extra styles needed here */
</style>
