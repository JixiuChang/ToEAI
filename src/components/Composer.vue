<template>
<div class="composer" role="form" aria-label="message composer">
<textarea
v-model="text"
class="composer-input"
placeholder="Send a message… (Ctrl/⌘ + Enter)"
rows="1"
@keydown.enter.prevent="handleEnter"
/>
<div class="composer-actions">
<button v-if="generating" class="btn danger" @click="onStop">Stop</button>
<button v-else class="btn primary" @click="send">Send</button>
</div>
</div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'


const props = defineProps<{ onSend: (text: string) => void; onStop: () => void; generating: boolean }>()
const text = ref('')


function send() {
if (text.value.trim()) {
props.onSend(text.value)
text.value = ''
}
}


function handleEnter(e: KeyboardEvent) {
if (!e.shiftKey) {
if (!props.generating && text.value.trim()) send()
}
}


function keyHandler(e: KeyboardEvent) {
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
e.preventDefault()
if (!props.generating && text.value.trim()) send()
}
}


onMounted(() => window.addEventListener('keydown', keyHandler))
onUnmounted(() => window.removeEventListener('keydown', keyHandler))
</script>