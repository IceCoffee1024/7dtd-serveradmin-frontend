<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { bytesToMB } from '~/utils';
import Doughnut from './Doughnut.vue';

interface Props {
  gameServerStats?: API.GameServer.Stats;
  systemMetricsSnapshot?: API.Devices.SystemMetricsSnapshot;
}
const props = defineProps<Props>();

const { t } = useI18n();

interface Status {
  used: number;
  free: number;
  centerText: string;
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

    playerStatus.used = newStats.onlinePlayers;
    playerStatus.free = newStats.maxOnlinePlayers - newStats.onlinePlayers;
    playerStatus.centerText = `${newStats.onlinePlayers} / ${newStats.maxOnlinePlayers}`;

    zombieStatus.used = newStats.zombies;
    zombieStatus.free = newStats.maxZombies - newStats.zombies;
    zombieStatus.centerText = `${newStats.zombies} / ${newStats.maxZombies}`;

    animalStatus.used = newStats.animals;
    animalStatus.free = newStats.maxAnimals - newStats.animals;
    animalStatus.centerText = `${newStats.animals} / ${newStats.maxAnimals}`;
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

    diskStatus.used = bytesToMB(newMetrics.diskInfos.map(i => i.usedSize).reduce((a, b) => a + b, 0));
    diskStatus.free = bytesToMB(newMetrics.diskInfos.map(i => i.freeSpace).reduce((a, b) => a + b, 0));
    diskStatus.centerText = `${((diskStatus.used / (diskStatus.free + diskStatus.used)) * 100) | 0} %`;
  },
);
</script>

<template>
  <div class="gap-4 grid grid-cols-5">
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
