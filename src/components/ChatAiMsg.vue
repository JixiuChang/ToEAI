<template>
  <div class="ai-msg">
    <div class="content">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<style scoped>
.ai-msg .content {
  /* ChatGPT-like: no bubble; full text block with comfortable line-height */
  max-width: 780px;
  line-height: 1.65;
  color: var(--text);
  /* very subtle backdrop to lift from bg (optional; still “not a bubble”) */
  background: transparent;
  padding: 0;           /* no padding => not a bubble */
  border: none;         /* not a bubble */
  border-radius: 0;     /* not a bubble */
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
