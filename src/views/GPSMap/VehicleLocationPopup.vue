<script lang="ts" setup>
import type { VehicleInventoryData, VehicleLocationFeatureData } from './types';
import { useI18n } from 'vue-i18n';
import { client } from '~/generated/api/client.gen';
import { useLocaleStore } from '~/stores/locale';
import { formatPosition } from '~/utils';
import GameIconEx from '~/components/PlayerInventoryDialog/GameIconEx/index.vue';

interface Props {
  data: VehicleLocationFeatureData;
}

const props = defineProps<Props>();
const { t } = useI18n();
const localeStore = useLocaleStore();
const loading = ref(false);
const inventory = ref<VehicleInventoryData | null>(null);
const errorMessage = ref('');

const vehicleName = computed(() => props.data.localizedName ?? props.data.vehicleName ?? props.data.entityName);
const ownerName = computed(() => props.data.ownerName ?? props.data.ownerId ?? t('common.unknown'));
const canLoadInventory = computed(() => props.data.isLoaded && props.data.hasStorage === true);

async function loadInventory() {
  inventory.value = null;
  errorMessage.value = '';

  if (!canLoadInventory.value) {
    return;
  }

  loading.value = true;
  try {
    const { data } = await client.get<VehicleInventoryData, unknown, true>({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      query: {
        language: localeStore.languageEnglishName,
      },
      url: `/api/GameServer/Vehicles/${props.data.entityId}/Inventory`,
      throwOnError: true,
    });
    inventory.value = data ?? null;
  }
  catch {
    errorMessage.value = t('views.map.vehicleInventoryUnavailable');
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => props.data.entityId,
  () => {
    void loadInventory();
  },
  { immediate: true },
);
</script>

<template>
  <div class="vehicle-popup">
    <div class="vehicle-popup__details">
      <div>
        {{ $t('views.map.vehicle') }}: {{ vehicleName }}
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
      <div v-if="data.fuelPercent != null">
        {{ $t('views.map.fuel') }}: {{ data.fuelPercent.toFixed(0) }}%
      </div>
      <div v-if="data.quality != null">
        {{ $t('components.playerInventoryDialog.quality') }}: {{ data.quality }}
      </div>
      <div v-if="data.hasStorage != null">
        {{ $t('views.map.storage') }}: {{ data.hasStorage ? $t('common.yes') : $t('common.no') }}
      </div>
    </div>

    <div class="vehicle-popup__inventory">
      <div class="vehicle-popup__section-title">
        {{ $t('views.map.vehicleInventory') }}
        <span v-if="data.storageItemCount != null">({{ data.storageItemCount }})</span>
      </div>

      <div v-if="!data.isLoaded" class="vehicle-popup__muted">
        {{ $t('views.map.vehicleInventoryUnloaded') }}
      </div>
      <div v-else-if="data.hasStorage === false" class="vehicle-popup__muted">
        {{ $t('views.map.vehicleNoStorage') }}
      </div>
      <div v-else-if="loading" class="vehicle-popup__muted">
        {{ $t('views.map.vehicleInventoryLoading') }}
      </div>
      <div v-else-if="errorMessage" class="vehicle-popup__muted">
        {{ errorMessage }}
      </div>
      <div v-else-if="inventory && inventory.items.length === 0" class="vehicle-popup__muted">
        {{ $t('components.myTable.noData') }}
      </div>
      <div v-else-if="inventory" class="vehicle-popup__items">
        <GameIconEx
          v-for="item in inventory.items"
          :key="`${item.itemName}-${item.count}-${item.quality ?? 0}`"
          v-bind="item"
          :size="38"
          :font-size="12"
          background-color="rgba(255, 255, 255, 0.14)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vehicle-popup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 15rem;
  max-width: 22rem;
}

.vehicle-popup__details {
  display: grid;
  gap: 0.25rem;
}

.vehicle-popup__inventory {
  display: grid;
  gap: 0.45rem;
}

.vehicle-popup__section-title {
  font-weight: 700;
}

.vehicle-popup__muted {
  color: rgba(255, 255, 255, 0.72);
}

.vehicle-popup__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 38px));
  gap: 0.35rem;
  max-height: 10.5rem;
  overflow: auto;
}
</style>
