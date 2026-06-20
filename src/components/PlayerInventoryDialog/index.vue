<script setup lang="ts">
import type { InventoryDto } from '~/generated/api/types.gen';
import type { InventorySlotItem, RemovePlayerInventoryItemRequestDto } from './types';
import { useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { useLatestAsync } from '~/composables/useLatestAsync';
import { usePopup } from '~/composables/usePopup';
import { gameServerGetPlayerInventoryQuery } from '~/generated/api/@pinia/colada.gen';
import { removePlayerInventoryItem } from './api';
import { createInventorySlotItems } from './inventorySlots';
import Grid from './Grid/index.vue';
import List from './List/index.vue';

type LayoutMode = 'list' | 'grid';

const { t } = useI18n();
const queryCache = useQueryCache();
const { confirm, toast } = usePopup();

const options = computed(() => [
  { label: t('components.playerInventoryDialog.list'), value: 'list' },
  { label: t('components.playerInventoryDialog.grid'), value: 'grid' },
]);

const dialogRef = useTemplateRef('dialogRef');
const title = ref('');
const currentPlayerId = ref('');
const layout = ref<LayoutMode>('grid');

const {
  data,
  pending: loading,
  execute: executeLatest,
  reset,
} = useLatestAsync<InventoryDto>();

async function fetchPlayerInventory(playerId: string): Promise<InventoryDto> {
  const options = gameServerGetPlayerInventoryQuery({ path: { playerId } });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data ?? { bag: [], belt: [], equipment: [] };
}

const bagItems = computed(() => createInventorySlotItems(data.value?.bag ?? [], 'Backpack'));
const beltItems = computed(() => createInventorySlotItems(data.value?.belt ?? [], 'Toolbelt'));
const equipmentItems = computed(() => createInventorySlotItems(data.value?.equipment ?? [], 'Equipment'));

async function refreshInventory(): Promise<void> {
  if (!currentPlayerId.value) {
    return;
  }

  await executeLatest(() => fetchPlayerInventory(currentPlayerId.value));
}

function describeSlot(slot: InventorySlotItem): string {
  const container = t(`components.playerInventoryDialog.containers.${slot.container}`);
  return `${container} #${slot.slotIndex}`;
}

async function executeRemove(slot: InventorySlotItem, body: RemovePlayerInventoryItemRequestDto): Promise<void> {
  await removePlayerInventoryItem({
    playerId: currentPlayerId.value,
    body,
  });
  toast({
    type: 'success',
    text: t('components.playerInventoryDialog.removeSuccess'),
  });
  await refreshInventory();
}

async function onRemoveSelected(slot: InventorySlotItem): Promise<void> {
  if (slot.container === 'Equipment') {
    toast({
      type: 'warning',
      text: t('components.playerInventoryDialog.removeSelectedUnsupported'),
    });
    return;
  }

  const name = slot.item.localizationName || slot.item.itemName;
  const confirmed = await confirm({
    type: 'warning',
    title: t('components.playerInventoryDialog.removeSelected'),
    text: t('components.playerInventoryDialog.removeSelectedConfirm', {
      item: name,
      slot: describeSlot(slot),
    }),
  });
  if (!confirmed) {
    return;
  }

  await executeRemove(slot, {
    itemName: slot.item.itemName,
    mode: 'SelectedSlot',
    container: slot.container,
    slotIndex: slot.slotIndex,
  });
}

async function onRemoveAll(slot: InventorySlotItem): Promise<void> {
  const name = slot.item.localizationName || slot.item.itemName;
  const confirmed = await confirm({
    type: 'warning',
    title: t('components.playerInventoryDialog.removeAllMatching'),
    text: t('components.playerInventoryDialog.removeAllMatchingConfirm', {
      item: name,
    }),
  });
  if (!confirmed) {
    return;
  }

  await executeRemove(slot, {
    itemName: slot.item.itemName,
    mode: 'AllMatching',
  });
}

function onDialogClosed(): void {
  reset();
  currentPlayerId.value = '';
}

async function open(playerId: string, playerName: string): Promise<void> {
  currentPlayerId.value = playerId;
  title.value = `${playerName} (${playerId})`;
  reset();
  dialogRef.value?.open();

  await executeLatest(() => fetchPlayerInventory(playerId));
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
    :title="$t('components.playerInventoryDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div :style="{ height: fullscreen ? 'calc(100vh - 80px)' : '618px' }">
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
          :bag="bagItems"
          :belt="beltItems"
          :equipment="equipmentItems"
          @remove-selected="onRemoveSelected"
          @remove-all="onRemoveAll"
        />
        <Grid
          v-else-if="layout === 'grid'"
          :bag="bagItems"
          :belt="beltItems"
          :equipment="equipmentItems"
          @remove-selected="onRemoveSelected"
          @remove-all="onRemoveAll"
        />
      </template>
      <el-empty v-else class="h-full" />
    </div>
  </MyDialog>
</template>
