<template>
  <section class="chat">
    <!-- Header (title + saved) -->
    <div class="chat-head">
      <!-- Display the current conversation title instead of an editable input -->
      <div v-if="current" class="chat-title">{{ current.title }}</div>
      <div style="flex:1"></div>
      <div class="saved-when" v-if="current">Saved {{ lastSaved }}</div>
    </div>

    <!-- Messages (scrolling) -->
    <div class="messages" ref="scrollEl">
      <div class="msg-wrap" v-if="current">
        <!-- Greeting when no messages exist -->
        <div v-if="thread.length === 0" class="chat-empty">Hello! What can I help you with?</div>

        <!-- Use full-width msg container so bubbles align with composer edges -->
        <div
          v-for="(m, i) in thread"
          :key="i"
          :class="['msg', m.role]"
        >
          <div :class="['bubble', m.role]">
            <!-- message content -->
            <div class="bubble-content">{{ m.content }}</div>

            <!-- attachments preview -->
            <div v-if="m.attachments?.length" class="attach-list">
              <a
                v-for="(f, k) in m.attachments"
                :key="k"
                :href="f.url"
                target="_blank"
                class="attach-link"
              >
                {{ f.name }}<span class="muted"> ({{ prettySize(f.size) }})</span>
              </a>
            </div>

            <!-- audio preview for future use -->
            <audio
              v-if="m.audioUrl"
              :src="m.audioUrl"
              controls
              preload="none"
              style="margin-top:8px;width:100%"
            ></audio>
          </div>
        </div>
      </div>

      <div v-else class="msg-wrap">
        <div class="bubble assistant">Login &amp; create a conversation to start.</div>
      </div>
    </div>

    <!-- Centered composer at the bottom -->
    <div class="composer">
      <div class="composer-inner">
        <form class="composer-box" @submit.prevent="send">
          <!-- Left: file picker button -->
          <button type="button" class="icon-btn" @click="pickFiles" title="Attach images">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 13l7-7a4 4 0 1 1 6 6l-9 9a6 6 0 0 1-8.5-8.5l8-8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <!-- Hidden file input -->
          <input ref="fileEl" type="file" multiple hidden @change="onFiles" accept="image/*" />

          <!-- Expanding message input -->
          <textarea
            ref="taRef"
            v-model="draft"
            class="textarea"
            placeholder="Message AI…"
            :disabled="!current"
            rows="1"
            @input="autoGrow"
            @keydown.enter.exact.prevent="send"
          ></textarea>

          <!-- Right: send paper plane -->
          <button type="submit" class="icon-btn" :disabled="!canSend" title="Send">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.5 12l16.5-7-5.5 7 5.5 7-16.5-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            </svg>
          </button>
        </form>

        <div v-if="attachments.length" class="attach-chips">
          <span
            class="chip"
            v-for="(a, idx) in attachments"
            :key="idx"
            :title="a.name"
          >
            {{ a.name }}
            <button class="x" type="button" @click="removeAttachment(idx)">x</button>
          </span>
        </div>

        <div class="hint-row">
          Your files stay on your device until you integrate the backend upload.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
// Import demo API functions. These return informative placeholders instead of calling a real backend.
import { generateImageFromPrompt } from '../api'

type Role = 'user'|'assistant'
type Attachment = { name: string; size: number; type: string; url: string }
type Message = { role: Role; content: string; attachments?: Attachment[], audioUrl?: string }
type Conv = { id: string; title: string; updatedAt: number }

const props = defineProps<{ currentUser: string | null }>()
const emit = defineEmits<{ (e:'touch-conversations'): void }>()

/* ---------- state ---------- */
const conversations = ref<Conv[]>([])
const current = ref<Conv | null>(null)
const thread = ref<Message[]>([])
const titleDraft = ref('')
const draft = ref('')
const attachments = ref<Attachment[]>([])
const fileEl = ref<HTMLInputElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

// Reference to the composer textarea.  Used to auto-grow the input as the
// user types.
const taRef = ref<HTMLTextAreaElement | null>(null)

/* ---------- expose to parent ---------- */
function newChat(){
  const id = genId()
  const c: Conv = { id, title:'New Chat', updatedAt: Date.now() }
  conversations.value = [c, ...conversations.value]
  saveConversations()
  current.value = c
  thread.value = []
  titleDraft.value = c.title
  saveThread()
  emit('touch-conversations')
}
defineExpose({ newChat })

/* ---------- computed ---------- */
const canSend = computed(() => !!current.value && !!draft.value.trim())
const lastSaved = computed(() => current.value ? new Date(current.value.updatedAt).toLocaleString() : '')

/* ---------- storage keys ---------- */
function chatsKey(){ return props.currentUser ? `chats:${props.currentUser}` : 'chats:guest' }
function threadKey(){ const u = props.currentUser || 'guest'; return current.value ? `chat:${u}:${current.value.id}` : '' }

/* ---------- storage helpers ---------- */
function loadConversations(){ conversations.value = JSON.parse(localStorage.getItem(chatsKey()) || '[]') }
function saveConversations(){ localStorage.setItem(chatsKey(), JSON.stringify(conversations.value)) }
function loadThread(){
  // Load the persisted thread from localStorage.  If there is no active
  // conversation, clear the thread.  When loading old messages, ensure
  // that each message has a `role` property.  Historically saved
  // messages may not include a role; in that case, derive the role
  // based on the index (first user, then assistant, alternating).
  if (!current.value) {
    thread.value = []
    return
  }
  const raw = localStorage.getItem(threadKey())
  let messages: any[] = []
  try {
    messages = raw ? JSON.parse(raw) : []
  } catch {
    messages = []
  }
  // Populate missing roles on legacy messages for proper alignment
  messages = messages.map((m, idx) => {
    if (!m.role) {
      // Alternate roles: even index → user, odd index → assistant
      m.role = idx % 2 === 0 ? 'user' : 'assistant'
    }
    return m
  })
  thread.value = messages as Message[]
}
function saveThread(){ if(!current.value) return; localStorage.setItem(threadKey(), JSON.stringify(thread.value)) }
function touchCurrent(){
  if(!current.value) return
  current.value.updatedAt = Date.now()
  const i = conversations.value.findIndex(c => c.id === current!.value!.id)
  if(i>=0) conversations.value[i] = { ...current.value }
  saveConversations()
  emit('touch-conversations')
}

/* ---------- selection ---------- */
function selectMostRecent(){
  if(conversations.value.length===0) return
  conversations.value.sort((a,b)=>b.updatedAt - a.updatedAt)
  current.value = conversations.value[0]
  titleDraft.value = current.value.title
  loadThread()
}
watch(()=>props.currentUser, () => {
  loadConversations(); selectMostRecent(); draft.value=''; attachments.value=[]
}, { immediate:true })

/* ---------- title ---------- */
function renameCurrent(){ if(!current.value) return; current.value.title = titleDraft.value.trim() || 'Untitled'; touchCurrent() }

/* ---------- files ---------- */
function pickFiles(){ fileEl.value?.click() }
function onFiles(e: Event){
  const input = e.target as HTMLInputElement
  if(!input.files) return
  for(const f of Array.from(input.files)){
    const url = URL.createObjectURL(f)
    attachments.value.push({ name:f.name, size:f.size, type:f.type, url })
  }
  input.value = ''
}
function removeAttachment(idx:number){
  const [removed] = attachments.value.splice(idx,1)
  if(removed) URL.revokeObjectURL(removed.url)
}
function prettySize(n:number){ if(n<1024) return `${n} B`; if(n<1048576) return `${(n/1024).toFixed(1)} KB`; return `${(n/1048576).toFixed(1)} MB` }

/* ---------- send ---------- */
async function send(){
  if(!canSend.value || !current.value) return

  // Capture the prompt before clearing it
  const prompt = draft.value.trim()
  // 1) user message
  thread.value.push({ role:'user', content: prompt, attachments: attachments.value.length ? [...attachments.value] : undefined })
  draft.value = ''
  attachments.value = []
  saveThread()
  touchCurrent()
  await nextTick(scrollBottom)

  // 2) Call the placeholder image generation API to simulate a backend reply.
  try {
    const resp = await generateImageFromPrompt(prompt)
    const replyText = resp?.text || 'generateImageFromPrompt is called'
    thread.value.push({ role:'assistant', content: replyText })
  } catch (err) {
    // Fallback in case the API call fails
    thread.value.push({ role:'assistant', content: 'generateImageFromPrompt is called' })
  }
  saveThread()
  touchCurrent()
  await nextTick(scrollBottom)
}

/* ---------- helpers ---------- */
// The quick() and surpriseMe() functions are unused now that
// message suggestions and random song prompts have been removed.
// function quick(prompt: string){ draft.value = prompt }
// async function surpriseMe(){ ... }
function genId(){ return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8) }
function scrollBottom(){ const el = scrollEl.value; if(!el) return; el.scrollTop = el.scrollHeight }

/* ---------- auto-grow ---------- */
function autoGrow() {
  const ta = taRef.value
  if (!ta) return
  // Reset height to auto to accurately measure scrollHeight
  ta.style.height = '0px'
  // Cap the height so it doesn't grow indefinitely
  const maxHeight = 200
  ta.style.height = Math.min(maxHeight, ta.scrollHeight) + 'px'
}

// Watch the draft for changes and grow the textarea accordingly
watch(draft, () => nextTick(autoGrow))
onMounted(() => nextTick(autoGrow))

/* ---------- cross-tab sync ---------- */
function onStorage(e: StorageEvent){
  if(e.key===chatsKey()){ loadConversations(); if(!current.value) selectMostRecent() }
  if(e.key===threadKey()){ loadThread(); nextTick(scrollBottom) }
}
onMounted(()=>window.addEventListener('storage', onStorage))
onUnmounted(()=>window.removeEventListener('storage', onStorage))
</script>