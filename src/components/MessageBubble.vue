<template>
<div :class="['bubble-row', msg.role === 'user' ? 'right' : 'left', msg.role === 'system' ? 'system' : '']">
<div class="bubble" role="article" :aria-label="msg.role + ' message'">
<div class="bubble-content">{{ msg.content }}</div>
<audio v-if="msg.audioUrl" class="bubble-audio" :src="msg.audioUrl" controls preload="none"></audio>
<div class="bubble-meta">{{ new Date(msg.timestamp).toLocaleTimeString() }}</div>
</div>
</div>
</template>


<script setup lang="ts">
import type { Message } from '../types'
defineProps<{ msg: Message }>()
</script>