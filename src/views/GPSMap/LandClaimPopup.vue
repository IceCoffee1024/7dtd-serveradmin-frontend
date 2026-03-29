<script lang="ts" setup>
import type { LandClaimFeatureData } from './types';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { removePlayerLandClaimByPosition } from '~/api/gameServer';
import { usePopup } from '~/composables';
import { formatPosition } from '~/utils';

interface Props {
  data: LandClaimFeatureData;
}

const props = defineProps<Props>();
const emit = defineEmits(['claimRemoved']);

const { t } = useI18n();
const { confirm } = usePopup();

async function handleRemoveClaim() {
  const confirmed = await confirm({ text: t('views.map.removeLandClaimConfirm'), type: 'warning' });
  if (confirmed) {
    await removePlayerLandClaimByPosition(props.data.claimPosition);
    emit('claimRemoved');
  }
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
    <button class="mt-4px" @click="handleRemoveClaim">
      {{ $t('views.map.removeLandClaim') }}
    </button>
  </div>
</template>
