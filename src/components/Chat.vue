<template>
  <section
    class="main chat-root"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- SINGLE TOP BAR -->
    <header class="topbar chat-topbar">
      <div class="topbar__left brand">
        <div class="brand-title">
          <div>ToEAI</div>
          <small>AI Music Chat</small>
        </div>
      </div>

      <div class="topbar__title chat-title">
        <span class="emoji">🎵</span>
        <span>Tales of Echo Studio</span>
      </div>

      <div class="topbar__right">
        <button
          class="button ghost"
          v-if="isLoggedIn"
          @click="$emit('logout')"
        >
          Logout
        </button>
        <button
          class="button ghost"
          v-else
          @click="$emit('openLogin')"
        >
          Login
        </button>
      </div>
    </header>

    <!-- BODY -->
    <div class="chat-body">
      <div class="messages">
        <!-- Chatlog when we have messages -->
        <Chatlog v-if="messages.length" :messages="messages" />

        <!-- Quick Start when empty -->
        <div v-else class="msg-wrap">
          <section class="quick-start">
            <h2 class="quick-title">
              <span class="emoji">🎵</span>
              <span>Quick Start - Music Tools</span>
            </h2>
            <p class="quick-sub">Choose a task to get started with your music creation workflow</p>

            <div class="qs-card">
              <div class="qs-section">
                <div class="qs-section-title">Suggestions</div>

                <!-- Show three random quickstarts -->
                <button
                  v-for="q in quickstarts"
                  :key="q.id"
                  class="qs-item"
                  @click="handleQuickStart(q.title)"
                  :aria-label="q.title"
                >
                  <div class="qs-item-left">
                    <div class="qs-icon">{{ q.icon }}</div>
                    <div class="qs-text">
                      <div class="qs-title">{{ q.title }}</div>
                      <div class="qs-badge ready">Ready</div>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18l6-6-6-6v12z"/></svg>
                </button>
              </div>

              <div class="qs-tip">
                <strong>Tip:</strong> Upload audio files by dragging them here or clicking the + button
              </div>
            </div>
          </section>
        </div>

        <!-- Referenced files (pending attachments for NEXT message) -->
        <section class="ref-files" v-if="referencedFiles.length">
          <div class="ref-head">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16l4-2l4 2l4-2l4 2V8l-6-6Z"/></svg>
            <span>Referenced Files ({{ referencedFiles.length }}) — will attach to your next message</span>
          </div>
          <div class="ref-list">
            <div class="ref-item" v-for="f in referencedFiles" :key="f.id">
              <div class="ref-name" :title="f.name">{{ f.name }}</div>
              <div class="ref-meta">{{ f.size }}</div>
              <button class="icon-btn" @click="removeFile(f.id)" aria-label="Remove file">
                <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg>
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- BOTTOM BAR (composer) -->
      <div class="composer sticky-composer">
        <div class="composer-inner">
          <div class="composer-box">
            <!-- UPLOAD ICON -->
            <button class="icon-btn" @click="triggerUpload" aria-label="Upload">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M5 20h14v-2H5v2Zm5-8v5h4v-5h3l-5-5l-5 5h3Z"/>
              </svg>
            </button>

            <textarea
              ref="ta"
              class="textarea"
              rows="1"
              v-model="draft"
              :placeholder="placeholder"
              @input="autosize"
              @keydown.enter.exact.prevent="compose()"
            />

            <!-- SEND ICON -->
            <button class="icon-btn send-btn" @click="compose()" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2l-15 2v7z"/>
              </svg>
            </button>

            <!-- Hidden native file input -->
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden-input"
              @change="onFileChosen"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- DRAG & DROP OVERLAY -->
    <div
      v-show="showDropOverlay"
      class="drop-overlay"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div class="drop-box">
        <div class="drop-icon">
          <svg width="40" height="40" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M19 18H5a3 3 0 0 1 0-6h.26A8 8 0 0 1 21 12a4 4 0 0 1-2 7h-0Zm-7-8v5h2v-5h3l-4-4l-4 4h3Z"/>
          </svg>
        </div>
        <div class="drop-text">Drop to upload</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import Chatlog from './Chatlog.vue';

defineProps<{ isLoggedIn?: boolean }>();
defineEmits<{
  (e: 'openLogin'): void
  (e: 'logout'): void
  (e: 'openTool', tool: 'stems' | 'chords' | 'analysis'): void
}>();

/** Messages */
type Msg = { id: string; role: 'user' | 'assistant'; text: string; ts: number };
const messages = ref<Msg[]>([]);

/** Quickstarts (6 total; show 3 random) */
type Quick = { id: string; title: string; icon: string };
const allQuick: Quick[] = [
  { id: 'stems',   title: 'Split audio into stems',           icon: '🎚️' },
  { id: 'chords',  title: 'Analyze chords of my song',        icon: '🎸' },
  { id: 'analysis',title: 'Run music analysis',               icon: '🧠' },
  { id: 'lyrics',  title: 'Generate lyrics about a lost city',icon: '📝' },
  { id: 'lofi',    title: 'Compose a lo-fi beat',             icon: '🎧' },
  { id: 'master',  title: 'Master this track',                icon: '🎛️' },
];
const quickstarts = ref<Quick[]>([]);
function pickRandom3() {
  const pool = [...allQuick];
  const out: Quick[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  quickstarts.value = out;
}

/** Referenced files (pending attachments for next message) */
type RefFile = { id: string; name: string; size: string };
const referencedFiles = ref<RefFile[]>([]);
function removeFile(id: string) {
  referencedFiles.value = referencedFiles.value.filter(f => f.id !== id);
}

/** Composer */
const placeholder = 'Describe your musical vision, upload audio, or ask for composition';
const draft = ref('');
const ta = ref<HTMLTextAreaElement | null>(null);
function autosize() {
  if (!ta.value) return;
  ta.value.style.height = 'auto';
  ta.value.style.height = Math.min(200, ta.value.scrollHeight) + 'px';
}

/** Upload (button + DnD) */
const fileInput = ref<HTMLInputElement | null>(null);
const showDropOverlay = ref(false);
let dragDepth = 0;

function triggerUpload() { fileInput.value?.click(); }
function onFileChosen(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  addFiles(Array.from(input.files));
  input.value = '';
}
function hasFiles(e: DragEvent): boolean {
  const types = e.dataTransfer?.types;
  return !!types && Array.from(types).some(t => t === 'Files' || t === 'application/x-moz-file');
}
function onDragEnter(e: DragEvent) { if (!hasFiles(e)) return; dragDepth++; showDropOverlay.value = true; }
function onDragOver(e: DragEvent) { if (!hasFiles(e)) return; if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; }
function onDragLeave(e: DragEvent) { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (dragDepth === 0) showDropOverlay.value = false; }
function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
  if (files.length) addFiles(files);
  dragDepth = 0; showDropOverlay.value = false;
}
function addFiles(files: File[]) {
  files.forEach(file => {
    referencedFiles.value.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name: file.name,
      size: formatBytes(file.size),
    });
  });
}

/** Mock API – constructs reply text per your rules */
async function callAssistantAPI(userText: string, fileCount: number): Promise<string> {
  await new Promise(r => setTimeout(r, 200));
  if (fileCount > 0 && userText) {
    return `API called on message: ${userText} — and ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`;
  }
  if (fileCount > 0 && !userText) {
    return `API called on message: (no text) — attached ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`;
  }
  return `API called on message: ${userText}`;
}

/** Compose – optional textParam (used by Quick Start) */
async function compose(textParam?: string) {
  const raw = textParam ?? draft.value;
  const text = raw.trim();
  const fileCount = referencedFiles.value.length;

  // If nothing to send, bail
  if (!text && fileCount === 0) return;

  // Show something for user row when they only send files (no text)
  const userDisplay = text || `Uploaded ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`;

  // Push user message
  messages.value.push({
    id: crypto?.randomUUID ? crypto.randomUUID() : `m_${Date.now()}_u`,
    role: 'user',
    text: userDisplay,
    ts: Date.now(),
  });

  // Clear input if it came from the composer
  if (!textParam) { draft.value = ''; nextTick(autosize); }

  // Build assistant reply using EXACT rules above
  const reply = await callAssistantAPI(text, fileCount);
  messages.value.push({
    id: crypto?.randomUUID ? crypto.randomUUID() : `m_${Date.now()}_a`,
    role: 'assistant',
    text: reply,
    ts: Date.now(),
  });

  // After sending, clear pending attachments (they were "attached" to this message)
  if (fileCount) referencedFiles.value = [];

  // Scroll to bottom
  nextTick(() => {
    const el = document.querySelector('.messages');
    if (el) el.scrollTop = el.scrollHeight;
  });
}

/** Quick Start click -> treat button text as user input */
function handleQuickStart(title: string) { compose(title); }

/** Helpers */
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 10 || i === 0 ? Math.round(val) : val.toFixed(2)} ${units[i]}`;
}

/** Init */
onMounted(() => { nextTick(autosize); pickRandom3(); });
</script>

<style scoped>
.chat-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative; /* anchor overlay */
}

/* Topbar */
.chat-topbar {
  position: sticky; top: 0; z-index: 5;
  background: rgba(0,0,0,.25); backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; }
.brand-title { line-height: 1; }
.brand-title small { color: var(--muted); }
.chat-title {
  position: absolute; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: .5rem;
  font-weight: 800; letter-spacing: .2px;
  background: linear-gradient(90deg, rgba(178,123,255,.95), rgba(255,179,230,.95));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* Body/scroll */
.chat-body { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; }
.messages { flex: 1 1 auto; overflow-y: auto; padding: 1.25rem 1.25rem 2rem; }

/* Quick Start fallback */
.msg-wrap { width: min(980px, 94%); margin-inline: auto; }

.quick-start { margin: 1.2rem auto 1.2rem; text-align: center; }
.quick-title {
  display: inline-flex; align-items: center; gap: .5rem;
  font-weight: 800; margin: .25rem 0;
  background: linear-gradient(90deg, rgba(178,123,255,.95), rgba(255,179,230,.95));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.quick-sub { color: var(--muted); margin: 0.25rem 0 0.9rem; }
.qs-card { margin: 0 auto; width: min(720px, 94%); background: linear-gradient(180deg, var(--panel), var(--panel-2)); border: 1px solid var(--border); border-radius: 1rem; padding: .6rem; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
.qs-section { padding: .25rem; }
.qs-section-title { text-align: left; color: var(--muted); font-weight: 700; padding: .25rem .5rem .5rem; }
.qs-item { width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; padding: .7rem .75rem; margin: .35rem 0; background: linear-gradient(180deg, rgba(35,28,45,.55), rgba(27,23,35,.55)); border: 1px solid var(--border); border-radius: .65rem; color: var(--text); text-align: left; cursor: pointer; }
.qs-item:hover { border-color: var(--accent-3); }
.qs-item-left { display: inline-flex; align-items: center; gap: .65rem; }
.qs-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); display: grid; place-items: center; background: linear-gradient(180deg, var(--panel), var(--panel-2)); font-size: 18px; }
.qs-text { display: inline-flex; align-items: center; gap: .5rem; }
.qs-title { font-weight: 700; }
.qs-badge.ready { font-size: .75rem; padding: .15rem .45rem; border: 1px solid #2e7d32; color: #69db7c; border-radius: 999px; background: rgba(105,219,124,.06); }
.qs-tip { margin-top: .5rem; padding: .6rem .75rem; background: linear-gradient(180deg, rgba(20,18,26,.65), rgba(20,18,26,.8)); color: var(--muted); border: 1px solid var(--border); border-radius: .6rem; text-align: left; }

/* Referenced files shelf */
.ref-files { margin: 1rem auto 0; width: min(980px, 94%); background: linear-gradient(180deg, var(--panel), var(--panel-2)); border: 1px solid var(--border); border-radius: .9rem; padding: .6rem .75rem; }
.ref-head { display: inline-flex; align-items: center; gap: .45rem; color: var(--muted); font-weight: 700; margin-bottom: .4rem; }
.ref-list { display: flex; flex-direction: column; gap: .5rem; }
.ref-item { display: grid; grid-template-columns: 1fr auto auto; gap: .6rem; align-items: center; padding: .5rem .55rem; border: 1px solid var(--border); border-radius: .6rem; background: linear-gradient(180deg, rgba(35,28,45,.55), rgba(27,23,35,.55)); }
.ref-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ref-meta { color: var(--muted); font-size: .85rem; }

/* Bottom bar */
.sticky-composer { position: sticky; bottom: 0; z-index: 4; border-top: 1px solid var(--border); background: linear-gradient(180deg, rgba(20,18,26,.82), rgba(20,18,26,.97)); }
.composer-inner { width: min(820px, 92vw); }
.send-btn { border-color: var(--accent-3); }
.hidden-input { display: none; }

/* Drag & Drop overlay */
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  pointer-events: all;
}
.drop-box {
  border: 2px dashed var(--accent-3);
  border-radius: 16px;
  padding: 28px 36px;
  background: rgba(178,123,255,.08);
  display: grid;
  place-items: center;
  gap: 10px;
}
.drop-icon { color: var(--text); opacity: .9; }
.drop-text { color: var(--text); font-weight: 800; letter-spacing: .2px; }

@media (max-width: 640px) {
  .chat-title { position: static; transform: none; }
  .messages { padding: .75rem; }
  .msg-wrap { width: 96%; }
}
</style>
