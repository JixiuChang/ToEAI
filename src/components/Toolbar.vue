<template>
<div class="toolbar">
<div class="toolbar-left">
<span class="brand">▶︎ Chatbot</span>
</div>
<div class="toolbar-right">
<button class="btn" @click="onToggleSystem">System</button>
<button class="btn" :disabled="disabled" @click="onExport">Export</button>
<button class="btn danger" :disabled="disabled" @click="onClear">Clear</button>
</div>
</div>
</template>


<script setup lang="ts">
defineProps<{ onClear: () => void; onExport: () => void; onToggleSystem: () => void; disabled?: boolean }>()
</script>