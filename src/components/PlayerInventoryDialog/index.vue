<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getPlayerInventory } from '~/api/gameServer';
import { useLatestAsync } from '~/composables/useLatestAsync';
import Grid from './Grid/index.vue';
import List from './List/index.vue';

type LayoutMode = 'list' | 'grid';

const { t } = useI18n();

const options = computed(() => [
  { label: t('components.playerInventoryDialog.list'), value: 'list' },
  { label: t('components.playerInventoryDialog.grid'), value: 'grid' },
]);

const dialogRef = useTemplateRef('dialogRef');
const title = ref('');
const layout = ref<LayoutMode>('grid');

const {
  data,
  pending: loading,
  execute: executeLatest,
  reset,
} = useLatestAsync<API.GameServer.Inventory>();

function onDialogClosed(): void {
  reset();
}

async function open(playerId: string, playerName: string): Promise<void> {
  title.value = `${playerName} (${playerId})`;
  reset();
  dialogRef.value?.open();

  await executeLatest(() => getPlayerInventory(playerId));
}

defineExpose({
  open,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    v-slot="{ isFullscreen }"
    class="min-w-650px"
    width="64%"
    :title="$t('components.playerInventoryDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div :style="{ height: isFullscreen ? 'calc(100vh - 80px)' : '618px' }">
      <div class="text-lg mb-3 flex gap-4 items-center justify-between">
        <span>{{ title }}</span>
        <el-radio-group v-model="layout" size="small">
          <el-radio-button v-for="item in options" :key="item.value" :value="item.value">
            <el-tooltip :content="item.label">
              <el-icon :size="16">
                <icon-ic-round-view-list v-if="item.value === 'list'" />
                <icon-ic-round-grid-view v-else />
              </el-icon>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </div>
      <template v-if="data">
        <List
          v-if="layout === 'list'"
          :bag="data.bag ?? []"
          :belt="data.belt ?? []"
          :equipment="data.equipment ?? []"
        />
        <Grid
          v-else-if="layout === 'grid'"
          :bag="data.bag ?? []"
          :belt="data.belt ?? []"
          :equipment="data.equipment ?? []"
        />
      </template>
      <el-empty v-else class="h-full" />
    </div>
  </MyDialog>
</template>
