// Pure-frontend demo auth (no validation). Swap internals later to hit your backend.
import { reactive, computed } from 'vue'

export type User = { username: string } | null

const state = reactive<{ user: User }>({
  user: loadUser()
})

function loadUser(): User {
  const raw = localStorage.getItem('currentUser')
  return raw ? { username: raw } : null
}

function setUser(name?: string) {
  const username = (name?.trim()) || 'demo'
  state.user = { username }
  localStorage.setItem('currentUser', username)
}

export const auth = {
  state,
  isLoggedIn: computed(() => !!state.user),
  userName: computed(() => state.user?.username ?? null),
  register: (u?: string) => setUser(u),
  login: (u?: string) => setUser(u),
  logout: () => { state.user = null; localStorage.removeItem('currentUser') }
}
