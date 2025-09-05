<template>
  <div class="app-shell" :class="{ collapsed }">
    <!-- Sidebar -->
    <Sidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      :conversations="conversations"
      :active-id="activeId"
      @new="onNewChat"
      @open="openChat"
      @toggle-collapse="collapsed = !collapsed"
      @close-mobile="mobileOpen = false"
    />

    <!-- Main column (flex column; only messages scroll) -->
    <div class="main">
      <header class="topbar">
        <!-- Mobile hamburger -->
        <button class="icon-btn" style="display:none" @click="mobileOpen = true" aria-label="Open menu" ref="hamburger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <strong style="display:flex;align-items:center;gap:10px">
          <span style="width:10px;height:10px;border-radius:999px;background:var(--brand)"></span>
          AI Music Chat
        </strong>
        <div style="display:flex;align-items:center;gap:8px">
          <button v-if="!isLoggedIn" class="btn" @click="loginOpen = true">Login</button>
          <div v-else style="display:flex;align-items:center;gap:8px">
            <span class="muted">Hello,</span> <strong>{{ userName }}</strong>
            <button class="btn" @click="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- Chat area -->
      <Chat ref="chatRef" :current-user="userName" @touch-conversations="loadConversations" />
    </div>
  </div>

  <LoginModal v-model:open="loginOpen" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Chat from './components/Chat.vue'
import LoginModal from './components/LoginModal.vue'
import { auth } from './stores/auth'

type Conv = { id: string; title: string; updatedAt: number }

const chatRef = ref<InstanceType<typeof Chat> | null>(null)
const loginOpen = ref(false)
const mobileOpen = ref(false)
const collapsed = ref(false)

const isLoggedIn = auth.isLoggedIn
const userName = auth.userName

const conversations = ref<Conv[]>([])
const activeId = ref<string | null>(null)

function keyForUser() { return userName.value ? `chats:${userName.value}` : 'chats:guest' }
function loadConversations(){
  const raw = localStorage.getItem(keyForUser())
  conversations.value = raw ? JSON.parse(raw) as Conv[] : []
  conversations.value.sort((a,b)=>b.updatedAt - a.updatedAt)
  activeId.value = conversations.value[0]?.id ?? null
}
function onNewChat(){ chatRef.value?.newChat(); loadConversations() }
function openChat(id:string){ activeId.value = id }
function logout(){ auth.logout(); loadConversations() }

onMounted(() => {
  loadConversations()
  // show hamburger on mobile only
  const mq = window.matchMedia('(max-width: 960px)')
  const btn = (document.querySelector('[ref=hamburger]') as HTMLElement) || null
  if (btn){ btn.style.display = mq.matches ? 'flex' : 'none'; mq.addEventListener('change', e => btn.style.display = e.matches ? 'flex' : 'none') }
})
watch(userName, () => { loadConversations(); mobileOpen.value = false })
</script>
