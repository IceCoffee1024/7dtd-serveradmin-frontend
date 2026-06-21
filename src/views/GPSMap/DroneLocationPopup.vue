<script lang="ts" setup>
import type { DroneLocationFeatureData } from './types';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation } from '~/composables';
import { formatPosition } from '~/utils';

interface Props {
  data: DroneLocationFeatureData;
}

const props = defineProps<Props>();
const { t } = useI18n();
const { viewPlayerProfile } = usePlayerProfileNavigation();

const droneName = computed(() => props.data.localizedName ?? props.data.entityName);
const ownerName = computed(() => props.data.ownerName ?? props.data.ownerId ?? t('common.unknown'));
const canViewOwnerProfile = computed(() => Boolean(props.data.ownerId));

function handleViewOwnerProfile() {
  if (!props.data.ownerId) {
    return;
  }

  viewPlayerProfile({ playerId: props.data.ownerId, playerName: props.data.ownerName ?? undefined });
}
</script>

<template>
  <div class="drone-popup">
    <div class="drone-popup__details">
      <div>
        {{ $t('views.map.drone') }}: {{ droneName }}
      </div>
      <div>
        {{ $t('components.playerDetailsDialog.position') }}: {{ formatPosition(data.position) }}
      </div>
      <div>
        {{ $t('views.map.owner') }}: {{ ownerName }}
      </div>
      <div>
        {{ $t('views.map.status') }}: {{ data.isLoaded ? $t('views.map.loaded') : $t('views.map.unloaded') }}
      </div>
    </div>

    <div v-if="canViewOwnerProfile" class="drone-popup__actions">
      <el-button type="primary" size="small" @click="handleViewOwnerProfile">
        <icon-mdi:account-card-outline class="mr-1" />
        {{ $t('views.playerList.viewProfile') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drone-popup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 14rem;
  max-width: 22rem;
}

.drone-popup__details {
  display: grid;
  gap: 0.25rem;
}

.drone-popup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drone-popup__actions :deep(.el-button) {
  margin-left: 0;
}
</style>
