<script setup lang="ts">
import type { StatsDto, SystemMetricsSnapshotDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { bytesToMB } from '~/utils';
import Doughnut from './Doughnut.vue';

interface Props {
  gameServerStats?: StatsDto;
  systemMetricsSnapshot?: SystemMetricsSnapshotDto;
}
const props = defineProps<Props>();

const { t } = useI18n();

interface Status {
  used: number;
  free: number;
  centerText: string;
}

function sumValues(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

const playerStatus = reactive<Status>({ used: 0, free: 0, centerText: '' });
const playerLegend = computed(() => [t('views.dashboard.status.onlinePlayers'), t('views.dashboard.status.freeSlots')]);
const zombieStatus = reactive<Status>({ used: 0, free: 0, centerText: '' });
const zombieLegend = computed(() => [t('views.dashboard.status.activeZombies'), t('views.dashboard.status.freeSlots')]);
const animalStatus = reactive<Status>({ used: 0, free: 0, centerText: '' });
const animalLegend = computed(() => [t('views.dashboard.status.activeAnimals'), t('views.dashboard.status.freeSlots')]);
const memoryStatus = reactive<Status>({ used: 0, free: 0, centerText: '' });
const memoryLegend = computed(() => [t('views.dashboard.status.usedMemory'), t('views.dashboard.status.freeMemory')]);
const diskStatus = reactive<Status>({ used: 0, free: 0, centerText: '' });
const diskLegend = computed(() => [t('views.dashboard.status.usedDisk'), t('views.dashboard.status.freeDisk')]);

watch(
  () => props.gameServerStats,
  (newStats) => {
    if (!newStats) {
      return;
    }

    const onlinePlayers = newStats.onlinePlayers ?? 0;
    const maxOnlinePlayers = newStats.maxOnlinePlayers ?? 0;
    const zombies = newStats.zombies ?? 0;
    const maxZombies = newStats.maxZombies ?? 0;
    const animals = newStats.animals ?? 0;
    const maxAnimals = newStats.maxAnimals ?? 0;

    playerStatus.used = onlinePlayers;
    playerStatus.free = Math.max(maxOnlinePlayers - onlinePlayers, 0);
    playerStatus.centerText = `${onlinePlayers} / ${maxOnlinePlayers}`;

    zombieStatus.used = zombies;
    zombieStatus.free = Math.max(maxZombies - zombies, 0);
    zombieStatus.centerText = `${zombies} / ${maxZombies}`;

    animalStatus.used = animals;
    animalStatus.free = Math.max(maxAnimals - animals, 0);
    animalStatus.centerText = `${animals} / ${maxAnimals}`;
  },
);

watch(
  () => props.systemMetricsSnapshot,
  (newMetrics) => {
    if (!newMetrics) {
      return;
    }

    if (!newMetrics.memoryInfo) {
      return;
    }

    memoryStatus.used = bytesToMB(newMetrics.memoryInfo.totalPhysicalMemory - newMetrics.memoryInfo.availablePhysicalMemory);
    memoryStatus.free = bytesToMB(newMetrics.memoryInfo.availablePhysicalMemory);
    memoryStatus.centerText = `${newMetrics.memoryInfo.usedPercentage} %`;

    const diskUsed = sumValues(newMetrics.diskInfos.map(i => i.usedSize ?? 0));
    const diskFree = sumValues(newMetrics.diskInfos.map(i => i.freeSpace));

    diskStatus.used = bytesToMB(diskUsed);
    diskStatus.free = bytesToMB(diskFree);
    diskStatus.centerText = diskUsed + diskFree > 0
      ? `${((diskUsed / (diskFree + diskUsed)) * 100) | 0} %`
      : '0 %';
  },
);
</script>

<template>
  <div class="status-grid">
    <Doughnut
      :title="$t('views.dashboard.status.players')"
      :used="playerStatus.used"
      :free="playerStatus.free"
      :center-text="playerStatus.centerText"
      :legend-labels="playerLegend"
    />
    <Doughnut
      :title="$t('views.dashboard.status.zombies')"
      :used="zombieStatus.used"
      :free="zombieStatus.free"
      :center-text="zombieStatus.centerText"
      :legend-labels="zombieLegend"
    />
    <Doughnut
      :title="$t('views.dashboard.status.animals')"
      :used="animalStatus.used"
      :free="animalStatus.free"
      :center-text="animalStatus.centerText"
      :legend-labels="animalLegend"
    />
    <Doughnut
      :title="$t('views.dashboard.status.memory')"
      :used="memoryStatus.used"
      :free="memoryStatus.free"
      :center-text="memoryStatus.centerText"
      :legend-labels="memoryLegend"
      unit="MB"
    />
    <Doughnut
      :title="$t('views.dashboard.status.disk')"
      :used="diskStatus.used"
      :free="diskStatus.free"
      :center-text="diskStatus.centerText"
      :legend-labels="diskLegend"
      unit="MB"
    />
  </div>
</template>

<style scoped lang="scss">
.status-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 1400px) {
  .status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
