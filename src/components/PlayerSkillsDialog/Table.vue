<script setup lang="ts">
interface Props {
  tableData: API.GameServer.PlayerSkill[];
  isExpandAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isExpandAll: true,
});

const tableRenderKey = ref(0);

function isSkillOrBookGroup(data: API.GameServer.PlayerSkill): boolean {
  return data.type === 'Skill' || data.type === 'BookGroup';
}

function getFieldValue(row: API.GameServer.PlayerSkill, field: 'level' | 'maxLevel' | 'costForNextLevel'): string | number {
  if (isSkillOrBookGroup(row)) {
    return '';
  }
  return row[field];
}

watch(
  () => props.isExpandAll,
  () => {
    tableRenderKey.value += 1;
  },
);
</script>

<template>
  <el-table
    :key="tableRenderKey"
    :data="tableData"
    row-key="name"
    :tree-props="{ children: 'children' }"
    :default-expand-all="isExpandAll"
    stripe
    border
    class="w-full"
    size="small"
    max-height="calc(80vh - 120px)"
  >
    <template #empty>
      <div class="text-gray-500 py-4 text-center dark:text-gray-300">
        {{ $t('components.myTable.noData') }}
      </div>
    </template>

    <el-table-column :label="$t('components.playerSkillsDialog.icon')" width="65">
      <template #default="{ row }">
        <GameIcon v-if="row.iconName" is-ui-icon :icon-name="row.iconName || ''" :size="36" :preview="false" />
      </template>
    </el-table-column>

    <el-table-column :label="$t('components.playerSkillsDialog.localizationName')" min-width="180">
      <template #default="{ row }">
        <el-tag :type="isSkillOrBookGroup(row) ? 'primary' : 'info'" effect="plain" disable-transitions>
          {{ row.localizationName || row.name }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column :label="$t('components.playerSkillsDialog.name')" min-width="180">
      <template #default="{ row }">
        <span :class="{ 'font-semibold': isSkillOrBookGroup(row) }">{{ row.name }}</span>
      </template>
    </el-table-column>

    <el-table-column :label="$t('components.playerSkillsDialog.level')" min-width="90">
      <template #default="{ row }">
        {{ getFieldValue(row, 'level') }}
      </template>
    </el-table-column>

    <el-table-column :label="$t('components.playerSkillsDialog.maxLevel')" min-width="100">
      <template #default="{ row }">
        {{ getFieldValue(row, 'maxLevel') }}
      </template>
    </el-table-column>

    <el-table-column :label="$t('components.playerSkillsDialog.costForNextLevel')" min-width="130">
      <template #default="{ row }">
        {{ getFieldValue(row, 'costForNextLevel') }}
      </template>
    </el-table-column>

    <el-table-column prop="type" :label="$t('components.playerSkillsDialog.type')" min-width="110" />
    <el-table-column prop="localizationDesc" :label="$t('components.playerSkillsDialog.localizationDesc')" min-width="220" show-overflow-tooltip />
  </el-table>
</template>
