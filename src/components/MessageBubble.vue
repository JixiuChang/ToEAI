<template>
  <div :class="['message', role]">
    <div class="meta">{{ who }} · {{ time }}</div>
    <div v-html="contentHtml"></div>
    <img v-for="(u, i) in imageUrls" :key="i" :src="u" alt="generated image" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  imageUrls?: string[]
}>()

const who = computed(() => {
  return props.role === 'user' ? 'You' : props.role === 'assistant' ? 'ToEAI' : 'System'
})

const time = computed(() => {
  return new Date(props.createdAt).toLocaleString()
})

// Render markdown-like bold (**bold**) and newlines.  For a production
// implementation you might use a real markdown parser.
const contentHtml = computed(() => {
  return props.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
})

const imageUrls = computed(() => props.imageUrls || [])
</script>