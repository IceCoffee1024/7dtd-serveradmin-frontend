<script setup lang="ts">
import HistoryPlayer from './HistoryPlayer/index.vue';
import OnlinePlayer from './OnlinePlayer/index.vue';

defineOptions({ name: 'PlayerList' });

const activeTab = ref('online');
</script>

<template>
  <el-card class="player-list-shell h-full min-h-0" shadow="never">
    <el-tabs v-model="activeTab" class="player-list-shell__tabs">
      <el-tab-pane name="online" :label="$t('views.playerList.onlinePlayers')" lazy>
        <OnlinePlayer />
      </el-tab-pane>
      <el-tab-pane name="history" :label="$t('views.playerList.historyPlayers')" lazy>
        <HistoryPlayer />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped lang="scss">
.player-list-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));

  :deep(.el-card__body) {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 1rem 1rem 0.85rem;
  }
}

.player-list-shell__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  :deep(.el-tabs__header) {
    flex: 0 0 auto;
    margin-bottom: 1rem;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 38px;
    padding: 0 1rem !important;
    border-radius: 999px;
    color: var(--el-text-color-secondary);
    font-weight: 700;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--colors-primary);
    background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
  }

  :deep(.el-tabs__content) {
    flex: 1 1 auto;
    min-height: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }
}
</style>
