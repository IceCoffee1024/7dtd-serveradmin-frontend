<script setup lang="ts">
import type { OnlinePlayerDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useIntervalFn } from '@vueuse/core';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useCommandHistory } from '~/composables';
import {
  gameServerGetOnlinePlayersQuery,
  gameServerSendGlobalMessageMutation,
  gameServerSendPrivateMessageMutation,
} from '~/generated/api/@pinia/colada.gen';
import { useGameEventStore } from '~/stores/gameEvent';
import { formatPosition } from '~/utils';

defineOptions({ name: 'LiveChat' });

const { t } = useI18n();
const queryCache = useQueryCache();
const gameEventStore = useGameEventStore();
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const contentRef = useTemplateRef<HTMLDivElement>('contentRef');
const isLoading = ref(false);
const loadingPlayers = ref(false);
const onlinePlayers = ref<OnlinePlayerDto[]>([]);
const selectedPlayerId = ref<string>();

const { currentCommand, navigateUp, navigateDown, addCommandToHistory, onInputChange } = useCommandHistory();
const sendGlobalMessageMutation = useMutation({
  ...gameServerSendGlobalMessageMutation(),
});
const sendPrivateMessageMutation = useMutation({
  ...gameServerSendPrivateMessageMutation(),
});

const selectedPlayer = computed(() =>
  onlinePlayers.value.find(player => player.playerId === selectedPlayerId.value),
);
const composerChannel = computed(() =>
  selectedPlayer.value
    ? t('views.chatSettings.preview.channels.whisper')
    : t('views.chatSettings.preview.channels.global'),
);

async function refreshPlayers(showLoading = true) {
  if (showLoading) {
    loadingPlayers.value = true;
  }
  try {
    const options = gameServerGetOnlinePlayersQuery({
      query: {
        pageSize: 100,
        order: 'PlayerName',
      },
    });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    onlinePlayers.value = state.data?.items ?? [];

    if (selectedPlayerId.value && !onlinePlayers.value.some(player => player.playerId === selectedPlayerId.value)) {
      selectedPlayerId.value = undefined;
    }
  }
  catch (error) {
    console.error(error);
    onlinePlayers.value = [];
    selectedPlayerId.value = undefined;
  }
  finally {
    if (showLoading) {
      loadingPlayers.value = false;
    }
  }
}

const { pause: pausePlayerRefresh, resume: resumePlayerRefresh } = useIntervalFn(
  () => {
    void refreshPlayers(false);
  },
  10000,
  { immediate: false },
);

function isScrolledToBottom(element: HTMLElement) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
}

async function scrollToBottom() {
  await nextTick();
  const element = contentRef.value;
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

async function onEnter() {
  const msg = currentCommand.value.trim();
  if (!msg)
    return;

  isLoading.value = true;
  try {
    if (selectedPlayer.value) {
      await sendPrivateMessageMutation.mutateAsync({
        body: {
          message: msg,
          senderName: null,
          targetPlayerIdOrName: selectedPlayer.value.playerId || selectedPlayer.value.playerName,
        },
      });
    }
    else {
      await sendGlobalMessageMutation.mutateAsync({ body: { message: msg, senderName: null } });
    }
    addCommandToHistory(msg);
    onInputChange('');
    await scrollToBottom();
  }
  finally {
    isLoading.value = false;
  }
}

function selectPlayer(player: OnlinePlayerDto) {
  selectedPlayerId.value = player.playerId;
  inputRef.value?.focus?.();
}

function clearSelectedPlayer() {
  selectedPlayerId.value = undefined;
}

function formatTimestamp(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('HH:mm:ss') : '';
}

function senderInitial(senderName: string) {
  const [first] = Array.from(senderName.trim() || 'S');
  return first?.toUpperCase() ?? 'S';
}

function displaySender(senderName: string) {
  return senderName?.trim() || t('views.chatSettings.preview.defaultSender');
}

const { pause, resume } = watch(
  () => gameEventStore.chatMessages.length,
  async () => {
    const element = contentRef.value;
    if (element && isScrolledToBottom(element)) {
      await scrollToBottom();
    }
  },
);

onActivated(() => {
  void scrollToBottom();
  void refreshPlayers();
  resume();
  resumePlayerRefresh();
});

onDeactivated(() => {
  pause();
  pausePlayerRefresh();
});

onBeforeUnmount(() => {
  pausePlayerRefresh();
});
</script>

<template>
  <div class="live-chat-page h-full min-h-0">
    <section class="live-chat-panel">
      <header class="live-chat-panel__header">
        <div class="live-chat-panel__title-group">
          <span class="live-chat-panel__status-dot" />
          <span class="live-chat-panel__title">{{ t('menus.liveChat') }}</span>
        </div>
        <el-tag round effect="plain" :type="selectedPlayer ? 'warning' : 'success'">
          {{ composerChannel }}
        </el-tag>
      </header>

      <div ref="contentRef" class="live-chat-messages">
        <div v-if="gameEventStore.chatMessages.length === 0" class="app-empty-state live-chat-empty">
          <div class="app-empty-state__icon">
            <icon-mdi:chat-outline />
          </div>
          <div class="app-empty-state__title">
            {{ t('components.myTable.noData') }}
          </div>
        </div>

        <article
          v-for="item in gameEventStore.chatMessages"
          :key="item.id"
          class="live-chat-message"
        >
          <div class="live-chat-message__avatar">
            {{ senderInitial(displaySender(item.senderName)) }}
          </div>
          <div class="live-chat-message__body">
            <div class="live-chat-message__meta">
              <span class="live-chat-message__sender">{{ displaySender(item.senderName) }}</span>
              <span v-if="formatTimestamp(item.timestamp)" class="live-chat-message__time">
                {{ formatTimestamp(item.timestamp) }}
              </span>
            </div>
            <p class="live-chat-message__text">
              {{ item.message }}
            </p>
          </div>
        </article>
      </div>

      <footer class="live-chat-composer">
        <div v-if="selectedPlayer" class="live-chat-composer__target">
          <el-tag
            class="live-chat-composer__target-tag"
            round
            size="small"
            effect="plain"
            closable
            @close="clearSelectedPlayer"
          >
            {{ selectedPlayer.playerName }} #{{ selectedPlayer.entityId }}
          </el-tag>
        </div>

        <div class="live-chat-composer__row">
          <el-tag class="live-chat-composer__channel" round effect="plain">
            {{ composerChannel }}
          </el-tag>
          <el-input
            ref="inputRef"
            :model-value="currentCommand"
            :placeholder="t('views.gameChat.typeMessage')"
            class="live-chat-composer__input"
            @update:model-value="(val: string | number) => onInputChange(String(val))"
            @keyup.enter="onEnter"
            @keydown.up.prevent="navigateUp"
            @keydown.down.prevent="navigateDown"
          />
          <el-button
            class="live-chat-composer__send"
            :disabled="!currentCommand.trim()"
            :loading="isLoading"
            type="primary"
            @click="onEnter"
          >
            <template #icon>
              <el-icon><icon-mdi-send /></el-icon>
            </template>
            {{ t('views.gameChat.send') }}
          </el-button>
        </div>
      </footer>
    </section>

    <aside v-loading="loadingPlayers" class="live-chat-online">
      <header class="live-chat-online__header">
        <div>
          <div class="live-chat-online__title">
            {{ t('views.playerList.onlinePlayers') }}
          </div>
          <div class="live-chat-online__count">
            {{ onlinePlayers.length }}
          </div>
        </div>

        <IconButton
          round
          border
          button-size="small"
          icon-size="16"
          :loading="loadingPlayers"
          :tooltip-content="t('components.myTable.refresh')"
          @click="() => refreshPlayers()"
        >
          <icon-mdi:refresh />
        </IconButton>
      </header>

      <div class="live-chat-online__body">
        <div v-if="onlinePlayers.length === 0" class="live-chat-online__empty">
          {{ t('components.myTable.noData') }}
        </div>

        <button
          v-for="player in onlinePlayers"
          :key="player.playerId"
          class="live-chat-player"
          :class="{ 'live-chat-player--active': player.playerId === selectedPlayerId }"
          type="button"
          @click="selectPlayer(player)"
        >
          <span class="live-chat-player__avatar">
            {{ senderInitial(player.playerName) }}
          </span>
          <span class="live-chat-player__main">
            <span class="live-chat-player__name">
              <span class="live-chat-player__name-text">{{ player.playerName }}</span>
              <el-tag v-if="player.isAdmin" size="small" round type="warning" effect="plain">
                {{ t('views.playerList.admin') }}
              </el-tag>
            </span>
            <span class="live-chat-player__meta">
              #{{ player.entityId }}
              <span v-if="player.ping != null">{{ player.ping }}ms</span>
              <span>{{ t('views.playerList.level') }} {{ player.level }}</span>
            </span>
            <span class="live-chat-player__position">
              {{ formatPosition(player.position) }}
            </span>
          </span>
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.live-chat-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1rem;
}

.live-chat-panel,
.live-chat-online {
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 18px 44px color-mix(in srgb, var(--colors-primary) 7%, transparent);
}

.live-chat-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.live-chat-panel__header,
.live-chat-online__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex: 0 0 auto;
  padding: 1rem 1rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-light) 66%, white 34%);
}

.live-chat-panel__title-group {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.live-chat-panel__status-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: var(--el-color-success);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--el-color-success) 14%, transparent);
}

.live-chat-panel__title,
.live-chat-online__title {
  color: var(--el-text-color-primary);
  font-weight: 800;
}

.live-chat-messages {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 0;
  padding: 1rem;
  overflow-x: hidden;
  overflow-y: auto;
}

.live-chat-empty {
  flex: 1 1 auto;
  min-height: 16rem;
}

.live-chat-message {
  display: grid;
  grid-template-columns: 2.15rem minmax(0, 1fr);
  gap: 0.7rem;
  max-width: min(48rem, 100%);
  padding: 0.75rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 98%, white 2%), var(--el-bg-color)),
    radial-gradient(circle at top left, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 38%);
}

.live-chat-message__avatar,
.live-chat-player__avatar {
  display: grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 14px;
  background: color-mix(in srgb, var(--colors-primary) 14%, transparent);
  color: var(--colors-primary);
  font-size: 0.82rem;
  font-weight: 800;
}

.live-chat-message__body {
  min-width: 0;
}

.live-chat-message__meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.live-chat-message__sender {
  color: var(--el-text-color-primary);
  font-size: 0.88rem;
  font-weight: 800;
}

.live-chat-message__time {
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 0.72rem;
}

.live-chat-message__text {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 0.92rem;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.live-chat-composer {
  flex: 0 0 auto;
  padding: 0.8rem 1rem 1rem;
  border-top: 1px solid color-mix(in srgb, var(--el-border-color-light) 66%, white 34%);
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent);
}

.live-chat-composer__target {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 100%;
  margin-bottom: 0.55rem;
  color: var(--el-text-color-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.live-chat-composer__target-tag {
  max-width: min(100%, 18rem);

  :deep(.el-tag__content) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.live-chat-composer__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
}

.live-chat-composer__channel {
  min-height: 2.1rem;
}

.live-chat-composer__input {
  min-width: 0;

  :deep(.el-input__wrapper) {
    border-radius: 16px;
    box-shadow: none;
  }
}

.live-chat-composer__send {
  border-radius: 16px;
  font-weight: 800;
}

.live-chat-online {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.live-chat-online__header {
  padding-bottom: 0.8rem;
}

.live-chat-online__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.55rem;
  height: 1.35rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--colors-primary) 12%, transparent);
  color: var(--colors-primary);
  font-size: 0.72rem;
  font-weight: 800;
}

.live-chat-online__empty {
  display: grid;
  place-items: center;
  min-height: 12rem;
  padding: 1rem;
  color: var(--el-text-color-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.live-chat-online__body {
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 0.75rem;
  overflow-x: hidden;
  overflow-y: auto;
}

.live-chat-player {
  display: grid;
  grid-template-columns: 2.15rem minmax(0, 1fr);
  gap: 0.7rem;
  width: calc(100% - 1.5rem);
  margin: 0.75rem 0.75rem 0;
  padding: 0.7rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 64%, white 36%);
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 97%, white 3%);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.live-chat-player:hover,
.live-chat-player--active {
  border-color: color-mix(in srgb, var(--colors-primary) 28%, transparent);
  background: color-mix(in srgb, var(--colors-primary) 8%, var(--el-bg-color));
  transform: translateY(-1px);
}

.live-chat-player__main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.live-chat-player__name {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 0.86rem;
  font-weight: 800;
}

.live-chat-player__name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-chat-player__meta,
.live-chat-player__position {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  color: var(--el-text-color-secondary);
  font-size: 0.72rem;
  line-height: 1.35;
}

.live-chat-player__position {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  overflow-wrap: anywhere;
}

@media (max-width: 1180px) {
  .live-chat-page {
    grid-template-columns: minmax(0, 1fr);
  }

  .live-chat-online {
    min-height: 18rem;
  }
}

@media (max-width: 720px) {
  .live-chat-composer__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .live-chat-composer__channel {
    display: none;
  }

  .live-chat-composer__send {
    min-width: 2.75rem;
    padding-inline: 0.8rem;
  }
}
</style>
