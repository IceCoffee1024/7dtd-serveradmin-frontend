<script lang="ts" setup>
import type { EntityInfoFeatureData } from './types';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation } from '~/composables';

interface Props {
  data: EntityInfoFeatureData;
}

const props = defineProps<Props>();
const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const { viewPlayerProfile } = usePlayerProfileNavigation();

function handleViewInventory() {
  playerInventoryDialogRef.value?.open(props.data.playerId!, props.data.entityName);
}

function handleViewProfile() {
  viewPlayerProfile({ playerId: props.data.playerId, playerName: props.data.entityName });
}

const { t } = useI18n();

const title = computed(() => {
  switch (props.data.entityType) {
    case 'OfflinePlayer':
      return `${t('views.map.offlinePlayer')}: ${props.data.entityName} (${props.data.playerId})`;
    case 'OnlinePlayer':
      return `${t('views.map.onlinePlayer')}: ${props.data.entityName} (${props.data.playerId})`;
    case 'Animal':
      return `${t('views.map.animal')}: ${props.data.entityName} (${props.data.entityId})`;
    case 'Hostiles':
      return `${t('views.map.hostiles')}: ${props.data.entityName} (${props.data.entityId})`;
    default:
      return `${props.data.entityType}: ${props.data.entityName} (${props.data.entityId})`;
  }
});
</script>

<template>
  <div>
    <div>
      {{ title }}
    </div>
    <template v-if="data.playerId">
      <div class="map-popup-actions">
        <el-button type="primary" size="small" @click="handleViewProfile">
          <icon-mdi:account-card-outline class="mr-1" />
          {{ $t('views.playerList.viewProfile') }}
        </el-button>
        <el-button size="small" @click="handleViewInventory">
          <icon-mdi:bag-personal-outline class="mr-1" />
          {{ $t('views.map.viewPlayerInventory') }}
        </el-button>
      </div>
      <PlayerInventoryDialog v-if="data.playerId" ref="playerInventoryDialogRef" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.map-popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.map-popup-actions :deep(.el-button) {
  margin-left: 0;
}
</style>
