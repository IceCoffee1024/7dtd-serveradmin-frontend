<script lang="ts" setup>
import type { EntityInfoFeatureData } from './types';
import { useI18n } from 'vue-i18n';

interface Props {
  data: EntityInfoFeatureData;
}

const props = defineProps<Props>();
const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');

function handleViewInventory() {
  playerInventoryDialogRef.value?.open(props.data.playerId!, props.data.entityName);
}

const { t } = useI18n();

const title = computed(() => {
  console.log('EntityInfoPopup title computed', props.data);
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
      <button v-if="data.playerId" class="mt-4px" @click="handleViewInventory">
        {{ $t('views.map.viewPlayerInventory') }}
      </button>
      <PlayerInventoryDialog v-if="data.playerId" ref="playerInventoryDialogRef" />
    </template>
  </div>
</template>
