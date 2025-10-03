<template>
  <div class="chatlog">
    <div
      v-for="m in messages"
      :key="m.id"
      class="row"
      :class="m.role"
    >
      <ChatAiMsg v-if="m.role === 'assistant'" :text="m.text" />
      <ChatUserMsg v-else :text="m.text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatAiMsg from './ChatAiMsg.vue';
import ChatUserMsg from './ChatUserMsg.vue';

defineProps<{
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; ts?: number }>
}>();
</script>

<style scoped>
.chatlog {
  /* same max width rhythm as the rest of the page */
  width: min(980px, 94%);
  margin-inline: auto;
}

/* each message row */
.row {
  margin: 14px 0;
  display: flex;
}

/* alignment */
.row.assistant { justify-content: flex-start; }
.row.user      { justify-content: flex-end; }
</style>
