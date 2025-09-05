<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0" style="background: rgba(0,0,0,.55)" @click="emitClose" />
    <div class="relative w-[min(92vw,520px)] rounded-xl" :style="panel">
      <header class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">{{ mode === 'login' ? 'Login' : 'Register' }}</h2>
        <button class="opacity-70 hover:opacity-100" @click="emitClose">✕</button>
      </header>

      <nav class="mb-5 flex gap-2">
        <button class="btn" :class="{ 'btn-primary': mode==='login' }" @click="mode='login'">Login</button>
        <button class="btn" :class="{ 'btn-primary': mode==='register' }" @click="mode='register'">Register</button>
      </nav>

      <form class="grid gap-3" @submit.prevent="onSubmit">
        <label class="grid gap-1">
          <span class="text-sm" style="opacity:.8">Username</span>
          <input v-model.trim="username" class="input" placeholder="(blank → 'demo')" />
        </label>

        <label class="grid gap-1">
          <span class="text-sm" style="opacity:.8">Password</span>
          <input v-model="password" type="password" class="input" placeholder="(ignored in demo)" />
        </label>

        <label v-if="mode==='register'" class="grid gap-1">
          <span class="text-sm" style="opacity:.8">Confirm password</span>
          <input v-model="password2" type="password" class="input" placeholder="(ignored in demo)" />
        </label>

        <div class="mt-2 flex items-center gap-2">
          <button type="submit" class="btn-primary">{{ mode==='login' ? 'Submit' : 'Create account' }}</button>
          <button type="button" class="btn" @click="emitClose">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { auth } from '../stores/auth'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const mode = ref<'login'|'register'>('login')
const username = ref('')
const password = ref('')
const password2 = ref('')

watch(() => props.open, (v) => {
  if (v) { mode.value='login'; username.value=''; password.value=''; password2.value='' }
})

function emitClose(){ emit('update:open', false) }

function onSubmit() {
  (mode.value === 'register' ? auth.register : auth.login)(username.value)
  emitClose()
}

const panel = computed(() => ({
  background: 'var(--panel)',
  color: 'var(--text)',
  padding: '16px',
  boxShadow: '0 12px 40px rgba(0,0,0,.5)'
}))
</script>

<style scoped>
.fixed { position: fixed; }
.inset-0 { top:0; left:0; right:0; bottom:0; }
.z-50 { z-index: 50; }
.flex { display:flex; }
.items-center { align-items:center; }
.justify-center { justify-content:center; }
.absolute { position:absolute; }
.relative { position:relative; }
.rounded-xl { border-radius: 16px; }
.w-\[min\(92vw,520px\)\] { width: min(92vw,520px); }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.25rem; }
.gap-2 { gap: .5rem; }
.grid { display:grid; }
.gap-3 { gap: .75rem; }
.mt-2 { margin-top: .5rem; }
.text-xl { font-size: 1.25rem; }
.font-semibold { font-weight: 600; }
.opacity-70 { opacity: .7; }
.opacity-70:hover { opacity: 1; }
</style>
