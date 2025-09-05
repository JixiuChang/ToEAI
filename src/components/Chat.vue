<template>
  <section class="chat">
    <!-- Header (title + saved) -->
    <div class="chat-head">
      <input
        v-if="current"
        class="input"
        style="max-width:520px"
        v-model="titleDraft"
        @change="renameCurrent"
        placeholder="Untitled conversation"
      />
      <div style="flex:1"></div>
      <div class="muted" v-if="current">Saved {{ lastSaved }}</div>
    </div>

    <!-- Messages (ONLY this scrolls) -->
    <div class="messages" ref="scrollEl">
      <div class="msg-wrap" v-if="current">
        <!-- Empty thread helper -->
        <div v-if="thread.length===0" style="display:grid;place-items:center;margin: 8px 0 2px">
          <button class="btn-primary" @click="surpriseMe">Surprise me with a random song</button>
        </div>

        <div v-for="(m,i) in thread" :key="i" :class="['bubble', m.role]">
          <div>{{ m.content }}</div>

          <!-- attachments preview -->
          <div v-if="m.attachments?.length" style="margin-top:8px;display:grid;gap:6px">
            <div v-for="(f,k) in m.attachments" :key="k" style="font-size:14px">
              <a :href="f.url" target="_blank" class="link">{{ f.name }}</a>
              <span class="muted"> ({{ prettySize(f.size) }})</span>
            </div>
          </div>

          <!-- (Optional) audio preview slot for music responses -->
          <audio v-if="m.audioUrl" :src="m.audioUrl" controls preload="none" style="margin-top:8px;width:100%"></audio>
        </div>
      </div>

      <div v-else class="msg-wrap">
        <div class="bubble assistant">Login & create a conversation to start.</div>
      </div>
    </div>

    <!-- GPT-like centered composer -->
    <div class="composer">
      <!-- Music quick chips -->
      <div class="quick-row" v-if="current">
        <button class="quick" @click="quick('ambient 80 BPM with airy pads')">Ambient</button>
        <button class="quick" @click="quick('lo-fi hip hop 72 BPM with vinyl crackle')">Lo-fi</button>
        <button class="quick" @click="quick('synthwave 110 BPM with retro bassline')">Synthwave</button>
        <button class="quick" @click="quick('piano ballad 92 BPM, emotive chords')">Piano</button>
        <button class="quick" @click="quick('orchestral 120 BPM, strings and brass')">Orchestral</button>
      </div>

      <div class="composer-inner">
        <form class="composer-box" @submit.prevent="send">
          <button type="button" class="icon-btn" @click="pickFiles" title="Attach stems/MIDI"></button>
          <input ref="fileEl" type="file" multiple hidden @change="onFiles" accept="audio/*,.mid,.midi" />

          <textarea
            v-model="draft"
            class="textarea"
            placeholder="Message AI…"
            :disabled="!current"
            rows="1"
            @keydown.enter.exact.prevent="send"
          ></textarea>

          <button class="btn-primary" :disabled="!canSend">Send</button>
        </form>

        <div v-if="attachments.length" class="attach-chips">
          <span class="chip" v-for="(a,idx) in attachments" :key="idx" :title="a.name">
            {{ a.name }}
            <button class="x" type="button" @click="removeAttachment(idx)">x</button>
          </span>
        </div>

        <div class="hint-row">Your audio/MIDI stays on your device until you integrate the backend upload.</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

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
function loadThread(){ if(!current.value){ thread.value=[]; return } thread.value = JSON.parse(localStorage.getItem(threadKey()) || '[]') }
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

  // 1) user message
  thread.value.push({ role:'user', content:draft.value.trim(), attachments: attachments.value.length ? [...attachments.value] : undefined })
  draft.value = ''
  attachments.value = []
  saveThread()
  touchCurrent()
  await nextTick(scrollBottom)

  // 2) In demo mode the backend is disabled: always reply with a fixed message
  const replyText = 'what api is called'
  thread.value.push({ role:'assistant', content: replyText })
  saveThread()
  touchCurrent()
  await nextTick(scrollBottom)
}

/* ---------- helpers ---------- */
function quick(prompt: string){ draft.value = prompt }
function surpriseMe(){
  if(!current.value) return
  // Push a placeholder message instead of calling the backend
  thread.value.push({ role:'assistant', content: 'what api is called' })
  saveThread()
  touchCurrent()
  nextTick(scrollBottom)
}
function genId(){ return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8) }
function scrollBottom(){ const el = scrollEl.value; if(!el) return; el.scrollTop = el.scrollHeight }

/* ---------- cross-tab sync ---------- */
function onStorage(e: StorageEvent){
  if(e.key===chatsKey()){ loadConversations(); if(!current.value) selectMostRecent() }
  if(e.key===threadKey()){ loadThread(); nextTick(scrollBottom) }
}
onMounted(()=>window.addEventListener('storage', onStorage))
onUnmounted(()=>window.removeEventListener('storage', onStorage))
</script>