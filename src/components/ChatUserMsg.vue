<template>
  <div class="user-msg">
    <div class="content">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<style scoped>
.user-msg .content {
  max-width: 780px;
  line-height: 1.65;
  color: var(--text);
  text-align: left;

  /* keep it “not a bubble” */
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;

  white-space: pre-wrap;
  word-break: break-word;
}
</style>
