<script lang="ts" setup>
import type { LandClaimFeatureData } from './types';
import { useMutation } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation, usePopup } from '~/composables';
import { gameServerRemovePlayerLandClaim2Mutation } from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { formatPosition } from '~/utils';

interface Props {
  data: LandClaimFeatureData;
}

const props = defineProps<Props>();
const emit = defineEmits(['claimRemoved']);

const { t } = useI18n();
const { confirm } = usePopup();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const removeLandClaimMutation = useMutation({
  ...gameServerRemovePlayerLandClaim2Mutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

async function handleRemoveClaim() {
  const confirmed = await confirm({ text: t('views.map.removeLandClaimConfirm'), type: 'warning' });
  if (confirmed) {
    await removeLandClaimMutation.mutateAsync({ body: props.data.claimPosition });
    emit('claimRemoved');
  }
}

function handleViewProfile() {
  viewPlayerProfile({ playerId: props.data.playerId, playerName: props.data.playerName });
}
</script>

<template>
  <div>
    <div>
      {{ $t('views.map.landOwner') }}: {{ `${data.playerName} (${data.playerId})` }}
      <br>
      {{ $t('components.playerDetailsDialog.position') }}: {{ formatPosition(data.claimPosition) }}
      <br>
      {{ $t('components.playerDetailsDialog.lastLogin') }}: {{ dayjs(data.lastLogin).format() }}
      <br>
      {{ $t('views.map.claimStatus') }}: {{ data.claimActive ? $t('views.map.claimActive') : $t('views.map.claimInactive') }}
    </div>
    <div class="map-popup-actions">
      <el-button type="primary" size="small" @click="handleViewProfile">
        <icon-mdi:account-card-outline class="mr-1" />
        {{ $t('views.playerList.viewProfile') }}
      </el-button>
      <el-button type="danger" plain size="small" @click="handleRemoveClaim">
        <icon-mdi:delete-outline class="mr-1" />
        {{ $t('views.map.removeLandClaim') }}
      </el-button>
    </div>
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
