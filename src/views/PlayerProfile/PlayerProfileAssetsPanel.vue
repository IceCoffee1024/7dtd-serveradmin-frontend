<script setup lang="ts">
import type { HomeLocationDto, VehicleLocationDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { formatPosition } from '~/utils';
import PlayerLandClaimContainersPanel from './PlayerLandClaimContainersPanel.vue';

defineProps<{
  playerId: string;
  homes: HomeLocationDto[];
  vehicles: VehicleLocationDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  viewPage: [name: string];
}>();

const { t } = useI18n();

function formatHomePosition(home: HomeLocationDto): string {
  if (home.x == null || home.y == null || home.z == null)
    return '--';
  return `${home.x}, ${home.y}, ${home.z}`;
}
</script>

<template>
  <div class="profile-panel-stack">
    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.homes') }}</h3>
        <el-button type="primary" link @click="emit('viewPage', 'TeleportHomes')">
          {{ t('components.myTable.view') }}
        </el-button>
      </div>
      <el-table :data="homes" size="small" border>
        <el-table-column prop="homeName" :label="t('views.playerProfile.fields.homeName')" />
        <el-table-column :label="t('views.playerList.position')">
          <template #default="{ row }">
            {{ formatHomePosition(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.fields.createdAt')">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.vehicles') }}</h3>
      <el-table :data="vehicles" size="small" border>
        <el-table-column prop="localizedName" :label="t('views.map.vehicle')" />
        <el-table-column prop="entityId" :label="t('views.playerList.entityId')" width="110" />
        <el-table-column :label="t('views.playerList.position')">
          <template #default="{ row }">
            {{ formatPosition(row.position) }}
          </template>
        </el-table-column>
        <el-table-column prop="storageItemCount" :label="t('views.map.storage')" width="120" />
      </el-table>
    </section>

    <PlayerLandClaimContainersPanel :player-id="playerId" />
  </div>
</template>

<style scoped lang="scss">
.profile-panel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
