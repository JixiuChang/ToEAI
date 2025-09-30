<template>
  <div class="modal__backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-bottom:.5rem;">
        <h3 style="margin:0">Account</h3>
        <button class="button ghost" @click="$emit('close')">Close</button>
      </div>
      <div class="separator" style="margin:.75rem 0"></div>
      <div style="display:grid; gap:.75rem;">
        <label>
          <div style="font-size:.9rem; color:var(--muted); margin-bottom:.25rem;">Username</div>
          <input class="input" v-model="username" placeholder="Enter username" />
        </label>
        <label>
          <div style="font-size:.9rem; color:var(--muted); margin-bottom:.25rem;">Password</div>
          <input class="input" type="password" v-model="password" placeholder="(not validated)" />
        </label>
        <div class="row" style="justify-content:flex-end;">
          <button class="button" @click="onLogin">Login</button>
          <button class="button ghost" @click="onLogout" v-if="isLogged">Logout</button>
        </div>
        <div style="font-size:.85rem; color:var(--muted);">No validation is performed — this is a placeholder UI.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { userLogin, userLogout } from '../api'
import { setUser, logoutUser, state } from '../store'

const username = ref('')
const password = ref('')
const isLogged = computed(() => state.currentUser !== 'Guest')

async function onLogin() {
  const name = username.value.trim() || 'User'
  const res = await userLogin(name)
  if (res.ok) setUser(res.username)
  // Clear input
  username.value = ''
  password.value = ''
  emitClose()
}

async function onLogout() {
  const res = await userLogout()
  if (res.ok) logoutUser()
  emitClose()
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

function emitClose() {
  emit('close')
}
</script>