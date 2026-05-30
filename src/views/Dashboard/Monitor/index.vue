<script setup lang="ts">
import type { CpuTimesDto, MemoryInfoDto, NetworkInfoDto } from '~/generated/api/types.gen';
import CPU_RAM from './CPU_RAM.vue';
import Network from './Network.vue';

interface Props {
  timestamp?: string;
  cpuTimes?: CpuTimesDto | null;
  memoryInfo?: MemoryInfoDto | null;
  networkInfos?: NetworkInfoDto[];
}
defineProps<Props>();
</script>

<template>
  <div class="gap-4 grid grid-cols-2">
    <CPU_RAM :timestamp="timestamp" :cpu-times="cpuTimes" :memory-info="memoryInfo" class="h-60" />
    <Network :timestamp="timestamp" :network-infos="networkInfos" class="h-60" />
  </div>
</template>
