<script setup lang="ts">
import GameIconEx from '../GameIconEx/index.vue';

interface Props {
  tableData?: API.GameServer.InvItem[];
}

const props = withDefaults(defineProps<Props>(), {
  tableData: () => [],
});
</script>

<template>
  <div class="h-[50vh]">
    <el-table :data="tableData" stripe border size="small" max-height="50vh">
      <template #empty>
        <div class="text-gray-500 py-4 text-center dark:text-gray-300">
          {{ $t('components.myTable.noData') }}
        </div>
      </template>

      <el-table-column :label="$t('components.playerInventoryDialog.icon')" min-width="90">
        <template #default="{ row }">
          <GameIconEx :size="48" :font-size="20" v-bind="row" />
        </template>
      </el-table-column>

      <el-table-column prop="localizationName" :label="$t('components.playerInventoryDialog.localizationName')" min-width="180" sortable>
        <template #default="{ row }">
          <el-tag type="info" effect="plain">
            {{ row.localizationName }}
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
  </div>
</template>
