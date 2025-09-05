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
export function setActiveSession(id: string) {
  state.activeSessionId = id
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
export function deleteSession(id: string) {
  const list = state.sessionsByUser[state.currentUser] || []
  const idx = list.findIndex(x => x.id === id)
  if (idx >= 0) {
    list.splice(idx, 1)
    if (state.activeSessionId === id) {
      state.activeSessionId = list[0]?.id
    }
    saveState()
  }
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