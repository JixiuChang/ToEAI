<template>
  <div class="layout">
    <!-- Left side navigation (conversation history) -->
    <Sidebar @new-chat="handleNewChat" />
    <!-- Main content column -->
    <div class="main">
      <Topbar @open-login="showLogin = true" />
      <!-- Chat view -->
      <Chat ref="chatRef" />
      <!-- Login modal toggled by Topbar -->
      <LoginModal v-if="showLogin" @close="showLogin = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import Chat from './components/Chat.vue'
import LoginModal from './components/LoginModal.vue'

// Control whether the login modal is visible
const showLogin = ref(false)

// Hold a reference to the Chat component so we can call its exposed methods
const chatRef = ref<InstanceType<typeof Chat> | null>(null)

// When the sidebar signals a new chat, reset the conversation in Chat.vue
function handleNewChat() {
  chatRef.value?.newChat()
}
</script>