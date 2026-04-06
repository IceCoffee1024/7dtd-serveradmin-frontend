<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import * as gameServerApi from '~/api/gameServer';
import { usePopup } from '~/composables';
import { useCommandHistory } from '~/composables/useCommandHistory';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import { useGameEventStore } from '~/stores/gameEvent';

defineOptions({ name: 'Console' });

const { t } = useI18n();
const { toast } = usePopup();
const gameEventStore = useGameEventStore();

interface CommandOption {
  cmd: string;
  desc: string;
  help: string;
}

interface SearchCallback {
  (results: CommandOption[]): void;
}

const contentRef = ref<HTMLDivElement>();
const allCommands = ref<CommandOption[]>([]);
const commandLookup = ref<Set<string>>(new Set());
const isLoading = ref(false);
const isSuggestionVisible = ref(false);
const { currentCommand, navigateUp, navigateDown, addCommandToHistory, onInputChange } = useCommandHistory();

const commandText = computed(() => currentCommand.value);
const isCommandInvalid = computed(() => {
  const trimmedVal = commandText.value.trim();
  if (!trimmedVal) {
    return true;
  }

  const commandPart = trimmedVal.split(' ')[0].toLowerCase();
  return !commandLookup.value.has(commandPart);
});

function handleArrowUp() {
  if (!isSuggestionVisible.value) {
    navigateUp();
  }
}
function handleArrowDown() {
  if (!isSuggestionVisible.value) {
    navigateDown();
  }
}

async function getAllowedCommands() {
  try {
    const data = await gameServerApi.getAllowedCommands();
    const processedCommands: CommandOption[] = [];
    const lookupSet = new Set<string>();
    data.forEach((group) => {
      (group.commands ?? []).forEach((cmd) => {
        processedCommands.push({
          cmd,
          desc: group.description ?? '',
          help: group.help ?? '',
        });
        lookupSet.add(cmd.toLowerCase());
      });
    });
    allCommands.value = processedCommands;
    commandLookup.value = lookupSet;
  }
  catch (error) {
    console.error('[Console] Failed to load allowed commands:', error);
  }
}
getAllowedCommands();

emitter.on(EVENT_TYPES.GAME.GAME_START_DONE, getAllowedCommands);

onUnmounted(() => {
  emitter.off(EVENT_TYPES.GAME.GAME_START_DONE, getAllowedCommands);
});

async function sendCommand() {
  if (isSuggestionVisible.value) {
    return;
  }

  if (isCommandInvalid.value) {
    toast({
      title: t('views.console.invalidCommand.title'),
      text: t('views.console.invalidCommand.text'),
      type: 'error',
    });
    return;
  }

  isLoading.value = true;
  try {
    const data = await gameServerApi.executeConsoleCommand(commandText.value, true);

    addCommandToHistory(commandText.value);
    onInputChange('');

    data.forEach((message) => {
      void gameEventStore.addLog(message, 'Assert');
    });
  }
  finally {
    isLoading.value = false;
  }
}

const logColorMap = {
  Error: 'red',
  Exception: 'red',
  Assert: '#BBBFC4',
  Warning: 'yellow',
  Log: '#00C814',
} as const;

function getColor(logType: string): string {
  return logColorMap[logType as keyof typeof logColorMap] || '#00C814';
}

const { pause, resume } = watch(
  () => gameEventStore.logs.length,
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

function search(query: string): CommandOption[] {
  if (query.includes(' ')) {
    return [];
  }

  if (!query) {
    return [...allCommands.value];
  }
  else {
    query = query.trim().toLowerCase();
    return allCommands.value.filter(c => c.cmd.toLowerCase().startsWith(query));
  }
}

function fetchSuggestions(query: string, cb: SearchCallback): void {
  cb(search(query));
}

function handleVisibleChange(visible: boolean): void {
  isSuggestionVisible.value = visible;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <el-card class="flex-1" shadow="never">
      <div ref="contentRef" class="h-[calc(100vh-210px)] overflow-y-auto">
        <p v-for="item in gameEventStore.logs" :key="item.id" :style="{ color: getColor(item.logType) }" class="font-mono whitespace-pre-wrap">
          {{ item.message }}
        </p>
      </div>
    </el-card>
    <div class="mt-2 flex">
      <el-autocomplete
        class="flex-1"
        :model-value="currentCommand"
        value-key="cmd"
        :fetch-suggestions="fetchSuggestions"
        clearable
        :class="{ 'is-invalid': isCommandInvalid }"
        :debounce="200"
        @update:model-value="(val: string | number) => onInputChange(String(val))"
        @keyup.enter="sendCommand"
        @visible-change="handleVisibleChange"
        @keydown.up.prevent="handleArrowUp"
        @keydown.down.prevent="handleArrowDown"
      >
        <template #default="{ item }">
          <el-tooltip :content="item.help" placement="top" :show-after="200" effect="dark">
            <div class="flex gap-3 w-full items-center">
              <div class="font-medium">
                {{ item.cmd }}
              </div>
              <div class="text-sm text-gray-500 ms-auto max-w-60 whitespace-nowrap text-ellipsis overflow-hidden dark:text-gray-300">
                {{ item.desc }}
              </div>
            </div>
          </el-tooltip>
        </template>
      </el-autocomplete>
      <el-button class="ms-2" :loading="isLoading" :disabled="isCommandInvalid" @click="sendCommand">
        <template #icon>
          <el-icon><icon-mdi-send /></el-icon>
        </template>
        {{ $t('views.console.send') }}
      </el-button>
    </div>
  </div>
</template>
