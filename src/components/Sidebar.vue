<template>
  <aside class="sidebar studio-sidebar">
    <!-- Buttons (Library toggle + always-on New Chat) -->
    <nav class="nav-buttons">
      <!-- Music Library: toggles on/off; gradient only when ON -->
      <button
        type="button"
        :class="['button', libraryOpenComputed ? 'gradient-btn' : 'ghost']"
        @click="toggleLibrary()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor"
            d="M3 5h14v2H3V5Zm0 6h14v2H3v-2Zm0 6h10v2H3v-2Zm15.59 0L22 20.41L20.41 22L17 18.59V17h1.59Z"/>
        </svg>
        <span>Music Library</span>
      </button>

      <!-- New Chat: always gradient; creates a new chat (App.vue closes Library if open) -->
      <button
        type="button"
        class="button gradient-btn"
        @click="$emit('create')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2h5Z"/>
        </svg>
        <span>New Chat</span>
      </button>
    </nav>

    <!-- List switches by Music Library toggle -->
    <div class="sidebar__list">
      <!-- Library ON => show audio items -->
      <template v-if="libraryOpenComputed">
        <button
          v-for="a in library"
          :key="a.id"
          class="sidebar__item"
          @click="$emit('play', a.id)"
        >
          <div class="item-main">
            <strong class="title-1" :title="a.title">{{ a.title }}</strong>
            <small class="muted">{{ a.meta ?? 'Audio' }}</small>
          </div>
          <div class="item-actions">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </button>
        <div v-if="!library || library.length === 0" class="empty-state">
          <div class="intro-text">No audio yet</div>
        </div>
      </template>

      <!-- Library OFF => show chat sessions -->
      <template v-else>
        <div
          v-for="s in sessions"
          :key="s.id"
          class="sidebar__row"
        >
          <!-- Row is a DIV with button semantics (fixes nested-button warning) -->
          <div
            class="sidebar__item"
            :class="{ active: s.id === activeId }"
            role="button"
            tabindex="0"
            @click="$emit('select', s.id)"
            @keydown.enter.prevent="$emit('select', s.id)"
            @keydown.space.prevent="$emit('select', s.id)"
          >
            <div class="item-main">
              <strong class="title-1" :title="s.title">{{ s.title }}</strong>
              <small class="muted">{{ formatWhen(s.updatedAt) }}</small>
            </div>

            <!-- 3-dot menu trigger (separate button) -->
            <button
              class="item-actions icon-dots"
              :aria-expanded="openMenuId === s.id"
              aria-haspopup="menu"
              aria-label="More options"
              @click.stop="toggleMenu(s.id, $event)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 8a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 8Zm0 6a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 14Zm0 6a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 20Z"/>
              </svg>
            </button>
          </div>

          <!-- Popover menu: fixed-positioned NEXT TO the dots; can extend outside sidebar -->
          <div
            v-if="openMenuId === s.id"
            class="item-menu"
            role="menu"
            @click.stop
            :style="menuStyle"
          >
            <button class="item-menu__btn" role="menuitem" @click="onRename(s.id)">Rename</button>
            <button class="item-menu__btn" role="menuitem" @click="onArchive(s.id)">Archive</button>
            <button class="item-menu__btn danger" role="menuitem" @click="onDelete(s.id)">Delete</button>
          </div>
        </div>

        <div v-if="!sessions || sessions.length === 0" class="empty-state">
          <div class="intro-text">No sessions yet</div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';

type SessionItem = { id: string; title: string; updatedAt: string | number | Date; };
type LibraryItem  = { id: string; title: string; meta?: string; };

const props = defineProps<{
  sessions: SessionItem[];
  library: LibraryItem[];
  activeId?: string;
  /** Optional external control: v-model:libraryOpen */
  libraryOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'select', id: string): void;
  (e: 'play', id: string): void;
  (e: 'update:libraryOpen', v: boolean): void;
  (e: 'rename', id: string): void;
  (e: 'archive', id: string): void;
  (e: 'delete', id: string): void;
}>();

/* Music Library toggle (controlled/uncontrolled) */
const _libraryOpen = ref<boolean>(props.libraryOpen ?? false);
watch(() => props.libraryOpen, v => { if (typeof v === 'boolean') _libraryOpen.value = v; });
const libraryOpenComputed = computed<boolean>(() =>
  typeof props.libraryOpen === 'boolean' ? !!props.libraryOpen : _libraryOpen.value
);
function setLibraryOpen(v: boolean) { if (props.libraryOpen === undefined) _libraryOpen.value = v; emit('update:libraryOpen', v); }
function toggleLibrary() { setLibraryOpen(!libraryOpenComputed.value); }

/* Menu state + position (fixed so it can bleed outside the sidebar) */
const openMenuId = ref<string | null>(null);
const menuPos = ref<{ top: number; left: number }>({ top: 0, left: 0 });
const MENU_W = 180;  // approximate menu width
const MENU_H = 160;  // approximate menu height

const menuStyle = computed(() => ({
  position: 'fixed',
  top: menuPos.value.top + 'px',
  left: menuPos.value.left + 'px',
  zIndex: 1000
}));

function toggleMenu(id: string, ev?: MouseEvent) {
  if (openMenuId.value === id) {
    closeMenu();
    return;
  }
  // compute viewport-anchored position next to the trigger
  if (ev && ev.currentTarget) {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    let left = rect.right + 8;
    let top  = rect.top - 8; // a little above center

    // keep inside viewport
    if (left + MENU_W > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_W - 8);
    }
    if (top + MENU_H > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - MENU_H - 8);
    }

    menuPos.value = { top, left };
  }
  openMenuId.value = id;
}

function closeMenu() { openMenuId.value = null; }

/* Close on outside click, scroll, resize */
function onWindowClick() { closeMenu(); }
function onWindowScroll() { closeMenu(); }
function onWindowResize() { closeMenu(); }

onMounted(() => {
  window.addEventListener('click', onWindowClick);
  window.addEventListener('scroll', onWindowScroll, true);
  window.addEventListener('resize', onWindowResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('click', onWindowClick);
  window.removeEventListener('scroll', onWindowScroll, true);
  window.removeEventListener('resize', onWindowResize);
});

/* util */
function formatWhen(dt: string | number | Date): string {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<style scoped>
/* Truncation + look */
.item-main { overflow: hidden; }
.title-1 {
  display: block;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: inherit;
}

/* Dots button */
.icon-dots {
  background: transparent;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: .8;
}
.icon-dots:hover { opacity: 1; }

/* Row container so menu can be absolutely/fixed placed logically */
.sidebar__row { position: relative; width: 100%; }

/* Focus ring for keyboard on the row */
.sidebar__item:focus-visible {
  outline: 2px solid var(--accent-3);
  outline-offset: 2px;
}

/* Popover menu look (now positioned with :style using position:fixed) */
.item-menu {
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--border);
  border-radius: .6rem;
  min-width: 170px;
  box-shadow: 0 10px 24px rgba(0,0,0,.35);
  padding: .25rem;
}
.item-menu__btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: .5rem;
  padding: .45rem .6rem;
  border: none;
  background: transparent;
  color: var(--text);
  border-radius: .5rem;
  cursor: pointer;
}
.item-menu__btn:hover { background: rgba(178,123,255,.14); }
.item-menu__btn.danger { color: #ff6b6b; }
.item-menu__btn.danger:hover { background: rgba(255,107,107,.12); }
</style>
