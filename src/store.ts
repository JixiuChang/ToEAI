import { reactive, computed } from 'vue'
import type { RootState, ChatSession, Message } from './types'

const STORAGE_KEY = 'toeai_state_v1'

/**
 * Generate a unique identifier.  Use a prefix to help differentiate between
 * sessions and messages.
 */
function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}

/**
 * Load the persisted state from localStorage.  If nothing exists, return
 * sensible defaults.
 */
function loadState(): RootState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RootState
  } catch {
    // Fall through and return default
  }
  return {
    currentUser: 'Guest',
    sessionsByUser: { Guest: [] },
    activeSessionId: undefined
  }
}

/**
 * Persist the current state to localStorage.  Be sure to call this after
 * mutating the state.
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const state = reactive<RootState>(loadState())

/**
 * Return the conversations for the current user, sorted by most recently
 * updated.
 */
export const currentSessions = computed(() => {
  const list = state.sessionsByUser[state.currentUser] || []
  return list.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

/**
 * Set the current user.  Creates a session list if the user is new.  If
 * there is no active session, set one if available.
 */
export function setUser(username: string) {
  state.currentUser = username || 'Guest'
  if (!state.sessionsByUser[state.currentUser]) {
    state.sessionsByUser[state.currentUser] = []
  }
  if (!state.activeSessionId && state.sessionsByUser[state.currentUser][0]) {
    state.activeSessionId = state.sessionsByUser[state.currentUser][0].id
  }
  saveState()
}

/**
 * Reset the current user to Guest and switch to the first guest session if any.
 */
export function logoutUser() {
  state.currentUser = 'Guest'
  if (!state.sessionsByUser.Guest) state.sessionsByUser.Guest = []
  state.activeSessionId = state.sessionsByUser.Guest[0]?.id
  saveState()
}

/**
 * Create a new session for the current user and set it as active.  The
 * session title defaults to "New Chat" and the session ID is unique.
 */
export function newSession(): ChatSession {
  const s: ChatSession = {
    id: uid('chat'),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  }
  if (!state.sessionsByUser[state.currentUser]) {
    state.sessionsByUser[state.currentUser] = []
  }
  state.sessionsByUser[state.currentUser].unshift(s)
  state.activeSessionId = s.id
  saveState()
  return s
}

/**
 * Return all sessions for the current user.
 */
export function allSessions(): ChatSession[] {
  return state.sessionsByUser[state.currentUser] || []
}

/**
 * Set the given session ID as active.
 */
/**
 * Set the given session ID as active.  Logs the ID so that the UI can
 * eventually check the session for display.  If the ID is falsy, the
 * active session is unset.  Always persists the change.
 */
export function setActiveSession(id: string) {
  state.activeSessionId = id
  // Log the session id to aid in debugging / future API checks
  if (id) {
    console.log(`checked for displaying: ${id}`)
  }
  saveState()
}

/**
 * Return the active session if present.
 */
export function getActiveSession(): ChatSession | undefined {
  return (state.sessionsByUser[state.currentUser] || []).find(s => s.id === state.activeSessionId)
}

/**
 * Rename the session with the given ID.  If the user sets an empty name,
 * fallback to "Untitled".
 */
export function renameSession(id: string, title: string) {
  const list = state.sessionsByUser[state.currentUser] || []
  const s = list.find(x => x.id === id)
  if (s) {
    s.title = title?.trim() || 'Untitled'
    s.updatedAt = new Date().toISOString()
    saveState()
  }
}

/**
 * Delete the session with the given ID.  If it was active, switch to the
 * next most recent session if available.
 */
/**
 * Delete the session with the given ID.  If it was the active session, we
 * switch to the next most recent session if available.  If there are no
 * sessions left after deletion, a brand new session is created and made
 * active.  Whenever the active session changes, we log the ID check for
 * debugging.  Note: All sessions are guaranteed to have a unique id.
 */
export function deleteSession(id: string) {
  const list = state.sessionsByUser[state.currentUser] || []
  const idx = list.findIndex(x => x.id === id)
  if (idx === -1) return
  // Determine if we are deleting the active session
  const deletingActive = state.activeSessionId === id
  // Remove the session
  list.splice(idx, 1)
  // If we just removed the active session, determine which session to show next
  if (deletingActive) {
    if (list.length > 0) {
      // Prefer the next item in the list (if it exists) or fallback to the last one
      const next = list[Math.min(idx, list.length - 1)]
      setActiveSession(next.id)
    } else {
      // No sessions left; create a brand new one and set it active
      const fresh = newSession()
      setActiveSession(fresh.id)
    }
  }
  // Save after mutation
  saveState()
}

/**
 * Append a message to the given session.  Automatically sets createdAt and
 * updates the session title if it’s the first user message.
 */
export function pushMessage(sessionId: string, m: Omit<Message, 'id' | 'createdAt'>) {
  const list = state.sessionsByUser[state.currentUser] || []
  const s = list.find(x => x.id === sessionId)
  if (!s) return
  s.messages.push({ id: uid('msg'), createdAt: new Date().toISOString(), ...m })
  s.updatedAt = new Date().toISOString()
  if (s.title === 'New Chat' && m.role === 'user' && m.content.trim()) {
    s.title = m.content.trim().slice(0, 40)
  }
  saveState()
}