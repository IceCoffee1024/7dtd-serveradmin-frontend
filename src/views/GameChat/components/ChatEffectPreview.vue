<script setup lang="ts">
export interface ChatEffectPreviewRow {
  key: string;
  channel: string;
  sender?: string;
  message: string;
  channelColor?: string;
  senderColor?: string;
  messageColor?: string;
}

interface Props {
  title: string;
  rows: ChatEffectPreviewRow[];
}

const props = defineProps<Props>();

const hudHeight = computed(() => {
  const rowCount = Math.max(props.rows.length, 1);
  return `${Math.min(172, Math.max(86, 40 + rowCount * 22))}px`;
});
</script>

<template>
  <section class="chat-effect-preview">
    <h3 class="chat-effect-preview__title">
      {{ title }}
    </h3>

    <div
      class="chat-effect-preview__hud"
      :style="{ '--chat-effect-preview-height': hudHeight }"
    >
      <div class="chat-effect-preview__log">
        <div
          v-for="row in rows"
          :key="row.key"
          class="chat-effect-preview__row"
        >
          <span
            class="chat-effect-preview__channel"
            :style="{ color: row.channelColor }"
          >[{{ row.channel }}]</span>
          <span
            v-if="row.sender"
            class="chat-effect-preview__sender"
            :style="{ color: row.senderColor }"
          >{{ row.sender }}</span>
          <span
            v-if="row.sender"
            class="chat-effect-preview__separator"
          >:</span>
          <span
            class="chat-effect-preview__message"
            :style="{ color: row.messageColor }"
          >{{ row.message }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.chat-effect-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-effect-preview__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.chat-effect-preview__hud {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: var(--chat-effect-preview-height);
  min-height: 86px;
  max-height: 172px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background-color: #272727;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -32px 42px rgba(0, 0, 0, 0.32);
  color: rgba(255, 255, 255, 0.86);
  font-family: Arial, 'Microsoft YaHei', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
}

.chat-effect-preview__log {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px 15px;
  font-size: 13px;
  line-height: 20px;
}

.chat-effect-preview__row {
  min-width: 0;
  overflow-wrap: anywhere;
}

.chat-effect-preview__channel {
  color: rgba(203, 213, 225, 0.76);
}

.chat-effect-preview__sender {
  margin-left: 4px;
  color: #facc15;
  font-weight: 700;
}

.chat-effect-preview__separator {
  margin: 0 4px 0 0;
  color: rgba(255, 255, 255, 0.78);
}

.chat-effect-preview__message {
  color: rgba(255, 255, 255, 0.86);
}
</style>
