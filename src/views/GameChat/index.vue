<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import * as gameServerApi from '~/api/gameServer';
import { useCommandHistory } from '~/composables';
import { useGameEventStore } from '~/stores/gameEvent';

defineOptions({ name: 'GameChat' });

const { t } = useI18n();
const gameEventStore = useGameEventStore();
const inputRef = ref<HTMLInputElement>();
const contentRef = ref<HTMLDivElement>();
const isLoading = ref(false);
const { currentCommand, navigateUp, navigateDown, addCommandToHistory, onInputChange } = useCommandHistory();

/** Send the current command as a global chat message. */
async function onEnter() {
  const msg = currentCommand.value.trim();
  if (!msg)
    return;

  isLoading.value = true;
  try {
    await gameServerApi.sendGlobalMessage(msg);
    addCommandToHistory(msg);
    onInputChange('');
  }
  finally {
    isLoading.value = false;
  }
}

/** Auto-scroll to bottom when new messages arrive (only if already at bottom). */
const { pause, resume } = watch(
  () => gameEventStore.chatMessages.length,
  async () => {
    const element = contentRef.value;
    if (element) {
      const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      if (isScrolledToBottom) {
        await nextTick(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    }
  },
);

onActivated(() => {
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight;
  }
  resume();
});

onDeactivated(() => {
  pause();
});
</script>

<template>
  <div class="flex flex-col h-full">
    <el-card class="flex-1" shadow="never">
      <div ref="contentRef" class="h-[calc(100vh-210px)] overflow-y-auto">
        <p
          v-for="item in gameEventStore.chatMessages"
          :key="item.id"
          class="text-[#00C814] font-mono whitespace-pre-wrap"
        >
          {{ `${item.senderName}: ${item.message}` }}
        </p>
      </div>
    </el-card>
    <div class="mt-2 flex">
      <el-input
        ref="inputRef"
        :model-value="currentCommand"
        :placeholder="t('views.gameChat.typeMessage')"
        class="flex-1"
        @update:model-value="(val: string | number) => onInputChange(String(val))"
        @keyup.enter="onEnter"
        @keydown.up.prevent="navigateUp"
        @keydown.down.prevent="navigateDown"
      />
      <el-button
        class="ms-2"
        :loading="isLoading"
        type="default"
        @click="onEnter"
      >
        <template #icon>
          <el-icon><icon-mdi-send /></el-icon>
        </template>
        {{ t('views.gameChat.send') }}
      </el-button>
    </div>
  </div>
</template>
