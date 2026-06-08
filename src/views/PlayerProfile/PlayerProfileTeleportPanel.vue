<script setup lang="ts">
import type { TeleportLogDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';

defineProps<{
  teleportLogs: TeleportLogDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  viewPage: [name: string];
}>();

const { t } = useI18n();

function formatTeleportPosition(log: TeleportLogDto, side: 'from' | 'to'): string {
  const x = side === 'from' ? log.fromX : log.toX;
  const y = side === 'from' ? log.fromY : log.toY;
  const z = side === 'from' ? log.fromZ : log.toZ;
  if (x == null || y == null || z == null)
    return '--';
  return `${x}, ${y}, ${z}`;
}
</script>

<template>
  <section class="profile-panel">
    <div class="profile-panel__header">
      <h3>{{ t('views.playerProfile.sections.teleportLogs') }}</h3>
      <el-button type="primary" link @click="emit('viewPage', 'TeleportLogs')">
        {{ t('components.myTable.view') }}
      </el-button>
    </div>
    <el-table :data="teleportLogs" size="small" border>
      <el-table-column :label="t('views.teleport.logs.columns.timestamp')" width="170">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="subSystem" :label="t('views.teleport.logs.columns.subSystem')" />
      <el-table-column :label="t('views.playerProfile.fields.from')">
        <template #default="{ row }">
          {{ formatTeleportPosition(row, 'from') }}
        </template>
      </el-table-column>
      <el-table-column :label="t('views.playerProfile.fields.to')">
        <template #default="{ row }">
          {{ formatTeleportPosition(row, 'to') }}
        </template>
      </el-table-column>
      <el-table-column prop="costPaid" :label="t('views.teleport.logs.columns.costPaid')" />
    </el-table>
  </section>
</template>

<style scoped lang="scss">
.profile-panel {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.profile-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-panel__header h3 {
  margin: 0;
}
</style>
