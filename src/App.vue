<template>
  <div class="layout">
    <!-- Left side navigation (conversation history) -->
    <Sidebar />
    <!-- Main content column -->
    <div class="main">
      <Topbar @open-login="showLogin = true" />
      <!-- Chat view -->
      <Chat />
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
</script>