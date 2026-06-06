<script lang="ts" setup>
import type { TraderLocationFeatureData } from './types';
import { formatPosition } from '~/utils';

interface Props {
  data: TraderLocationFeatureData;
}

defineProps<Props>();
</script>

<template>
  <div>
    <div>
      {{ $t('views.map.trader') }}: {{ data.localizedName ?? data.name }}
      <br>
      {{ $t('components.playerDetailsDialog.position') }}: {{ formatPosition(data.position) }}
      <br>
      {{ $t('views.map.prefab') }}: {{ data.prefabName ?? '-' }}
      <br>
      {{ $t('views.map.areaPosition') }}: {{ formatPosition(data.areaPosition) }}
      <br>
      {{ $t('views.map.protectArea') }}: {{ formatPosition(data.protectPosition) }} / {{ formatPosition(data.protectSize) }}
      <br>
      {{ $t('views.map.status') }}: {{ data.isClosed ? $t('views.map.closed') : $t('views.map.open') }}
    </div>
  </div>
</template>
