<script setup lang="ts">
import type { PlayerSkillDto } from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import { useLatestAsync } from '~/composables/useLatestAsync';
import { gameServerGetPlayerSkillsQuery } from '~/generated/api/@pinia/colada.gen';
import Table from './Table.vue';

defineOptions({ name: 'PlayerSkillsDialog' });

type LayoutMode = 'collapse' | 'expand';

const dialogRef = useTemplateRef('dialogRef');
const title = ref('');
const activeTab = ref('0');

const { t } = useI18n();
const queryCache = useQueryCache();
const layout = ref<LayoutMode>('expand');

const {
  data,
  pending: loading,
  execute: executeLatest,
  reset,
} = useLatestAsync<PlayerSkillDto[]>({
  initialValue: [],
});

async function fetchPlayerSkills(playerId: string): Promise<PlayerSkillDto[]> {
  const options = gameServerGetPlayerSkillsQuery({ path: { playerId } });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data ?? [];
}

const options = computed<Array<{ label: string; value: LayoutMode }>>(() => [
  { label: t('components.playerSkillsDialog.collapse'), value: 'collapse' },
  { label: t('components.playerSkillsDialog.expand'), value: 'expand' },
]);

function onDialogClosed() {
  reset();
  title.value = '';
  activeTab.value = '0';
  layout.value = 'expand';
}

async function open(playerId: string, playerName: string) {
  title.value = `${playerName} (${playerId})`;
  reset();
  activeTab.value = '0';
  layout.value = 'expand';
  dialogRef.value?.open();

  await executeLatest(() => fetchPlayerSkills(playerId));
}

defineExpose({
  open,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    v-slot="{ fullscreen }"
    class="min-w-650px"
    width="64%"
    :title="$t('components.playerSkillsDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div class="player-skills-dialog" :style="{ height: fullscreen ? 'calc(100vh - 80px)' : '618px' }">
      <div class="player-skills-dialog__toolbar">
        <span class="player-skills-dialog__title">{{ title }}</span>
        <el-radio-group v-model="layout" size="small" class="player-skills-dialog__layout-switch">
          <el-radio-button v-for="item in options" :key="item.value" :value="item.value">
            <el-tooltip :content="item.label" placement="top">
              <el-icon>
                <icon-mdi-unfold-less-horizontal v-if="item.value === 'collapse'" />
                <icon-mdi-unfold-more-horizontal v-else />
              </el-icon>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </div>

      <template v-if="data?.length">
        <el-tabs v-model="activeTab" class="player-skills-dialog__tabs">
          <el-tab-pane v-for="(item, index) in data" :key="item.name || String(index)" :name="String(index)" lazy>
            <template #label>
              <div class="flex gap-1 items-center">
                <GameIcon v-if="item.iconName" ui-icon :icon-name="item.iconName" :size="24" :preview="false" />
                <span>{{ `${item.localizationName || item.name} (${$t('components.playerSkillsDialog.level')} ${item.level})` }}</span>
              </div>
            </template>
            <Table :table-data="item.children ?? []" :expand-all="layout === 'expand'" />
          </el-tab-pane>
        </el-tabs>
      </template>
      <div v-else class="app-empty-state player-skills-dialog__empty">
        <div class="app-empty-state__icon">
          <icon-mdi-school-outline />
        </div>
        <div class="app-empty-state__title">
          {{ $t('components.playerSkillsDialog.header') }}
        </div>
        <div class="app-empty-state__description">
          {{ $t('components.myTable.noData') }}
        </div>
      </div>
    </div>
  </MyDialog>
</template>

<style scoped lang="scss">
.player-skills-dialog {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.player-skills-dialog__toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.player-skills-dialog__title {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
  color: var(--el-text-color-primary);
  font-size: 0.84rem;
  font-weight: 700;
}

.player-skills-dialog__layout-switch {
  :deep(.el-radio-button__inner) {
    border-radius: 999px;
  }
}

.player-skills-dialog__tabs {
  height: calc(100% - 52px);

  :deep(.el-tabs__content) {
    height: calc(100% - 54px);
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.player-skills-dialog__empty {
  min-height: 320px;
}

@media (max-width: 720px) {
  .player-skills-dialog__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
