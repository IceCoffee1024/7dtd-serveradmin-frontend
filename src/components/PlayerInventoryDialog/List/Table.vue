<script setup lang="ts">
import type { InvItemDto } from '~/generated/api/types.gen';
import GameIconEx from '../GameIconEx/index.vue';

interface Props {
  tableData?: InvItemDto[];
}

withDefaults(defineProps<Props>(), {
  tableData: () => [],
});
</script>

<template>
  <el-table :data="tableData" stripe border size="small" height="100%" class="inventory-table">
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
        <GameIconEx :size="48" :font-size="18" v-bind="row" />
      </template>
    </el-table-column>

    <el-table-column prop="localizationName" :label="$t('components.playerInventoryDialog.localizationName')" min-width="180" sortable>
      <template #default="{ row }">
        <el-tag type="info" effect="plain">
          {{ row.localizationName || row.itemName }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="itemName" :label="$t('components.playerInventoryDialog.itemName')" min-width="160" sortable />

    <el-table-column :label="$t('components.playerInventoryDialog.mod')" min-width="220">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-1">
          <GameIconEx v-for="(item, index) in (row.parts || [])" :key="index" :size="60" v-bind="item" />
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
