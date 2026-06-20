<script setup lang="ts">
import type { InventorySlotItem } from '../types';
import Table from './Table.vue';

interface Props {
  bag?: InventorySlotItem[];
  belt?: InventorySlotItem[];
  equipment?: InventorySlotItem[];
}

withDefaults(defineProps<Props>(), {
  bag: () => [],
  belt: () => [],
  equipment: () => [],
});

const emit = defineEmits<{
  removeSelected: [slot: InventorySlotItem];
  removeAll: [slot: InventorySlotItem];
}>();

const activeTab = ref('bag');
</script>

<template>
  <el-tabs v-model="activeTab" class="inventory-tabs">
    <el-tab-pane name="bag" :label="$t('components.playerInventoryDialog.bag')">
      <Table
        :table-data="bag"
        @remove-selected="slot => emit('removeSelected', slot)"
        @remove-all="slot => emit('removeAll', slot)"
      />
    </el-tab-pane>
    <el-tab-pane name="belt" :label="$t('components.playerInventoryDialog.belt')">
      <Table
        :table-data="belt"
        @remove-selected="slot => emit('removeSelected', slot)"
        @remove-all="slot => emit('removeAll', slot)"
      />
    </el-tab-pane>
    <el-tab-pane name="equipment" :label="$t('components.playerInventoryDialog.equipment')">
      <Table
        :table-data="equipment"
        @remove-selected="slot => emit('removeSelected', slot)"
        @remove-all="slot => emit('removeAll', slot)"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss">
.inventory-tabs {
  height: calc(100% - 40px);

  :deep(.el-tabs__content) {
    height: calc(100% - 54px);
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>
