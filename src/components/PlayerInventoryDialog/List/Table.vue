<script setup lang="ts">
import type { InventorySlotItem } from '../types';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useI18n } from 'vue-i18n';
import { showCustomContextMenu } from '~/plugins/contextMenu';
import { markIcon } from '~/utils';
import GameIconEx from '../GameIconEx/index.vue';

interface Props {
  tableData?: InventorySlotItem[];
}

withDefaults(defineProps<Props>(), {
  tableData: () => [],
});

const emit = defineEmits<{
  removeSelected: [slot: InventorySlotItem];
  removeAll: [slot: InventorySlotItem];
}>();

const { t } = useI18n();
const iconRemoveSelected = markIcon(() => import('~icons/mdi/package-variant-remove'));
const iconRemoveAll = markIcon(() => import('~icons/mdi/delete-sweep-outline'));

function onRowContextMenu(row: InventorySlotItem, _column: unknown, event: MouseEvent): void {
  event.preventDefault();
  const options: ContextMenuOption<InventorySlotItem>[] = [
    {
      label: t('components.playerInventoryDialog.removeSelected'),
      icon: iconRemoveSelected,
      disabled: item => item?.container === 'Equipment',
      command: item => item && emit('removeSelected', item),
    },
    {
      label: t('components.playerInventoryDialog.removeAllMatching'),
      icon: iconRemoveAll,
      divided: true,
      command: item => item && emit('removeAll', item),
    },
  ];
  showCustomContextMenu(event, options, row);
}
</script>

<template>
  <el-table :data="tableData" stripe border size="small" height="100%" class="inventory-table" @row-contextmenu="onRowContextMenu">
    <template #empty>
      <div class="app-empty-state inventory-table__empty">
        <div class="app-empty-state__icon">
          <icon-mdi-briefcase-outline />
        </div>
        <div class="app-empty-state__title">
          {{ $t('components.playerInventoryDialog.bag') }}
        </div>
        <div class="app-empty-state__description">
          {{ $t('components.myTable.noData') }}
        </div>
      </div>
    </template>

    <el-table-column :label="$t('components.playerInventoryDialog.icon')" min-width="90">
      <template #default="{ row }">
        <GameIconEx :size="48" :font-size="18" v-bind="row.item" />
      </template>
    </el-table-column>

    <el-table-column prop="item.localizationName" :label="$t('components.playerInventoryDialog.localizationName')" min-width="180" sortable>
      <template #default="{ row }">
        <el-tag type="info" effect="plain">
          {{ row.item.localizationName || row.item.itemName }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="item.itemName" :label="$t('components.playerInventoryDialog.itemName')" min-width="160" sortable />

    <el-table-column :label="$t('components.playerInventoryDialog.mod')" min-width="220">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-1">
          <GameIconEx v-for="(item, index) in (row.item.parts || [])" :key="index" :size="60" v-bind="item" />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.inventory-table__empty {
  min-height: 220px;
}
</style>
