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
  <div class="monitor-grid">
    <section class="monitor-panel">
      <div class="monitor-panel__header">
        <div class="monitor-panel__title-wrap">
          <span>{{ $t('views.dashboard.monitor.cpu') }} / {{ $t('views.dashboard.monitor.ram') }}</span>
          <small>{{ $t('views.dashboard.monitor.usage') }}</small>
        </div>
        <span class="monitor-panel__badge">
          <icon-mdi-pulse />
        </span>
      </div>
      <div class="monitor-panel__chart">
        <CPU_RAM :timestamp="timestamp" :cpu-times="cpuTimes" :memory-info="memoryInfo" />
      </div>
    </section>
    <section class="monitor-panel">
      <div class="monitor-panel__header">
        <div class="monitor-panel__title-wrap">
          <span>{{ $t('views.dashboard.monitor.network') }}</span>
          <small>{{ $t('views.dashboard.monitor.trafficIn') }} / {{ $t('views.dashboard.monitor.trafficOut') }}</small>
        </div>
        <span class="monitor-panel__badge">
          <icon-mdi-lan />
        </span>
      </div>
      <div class="monitor-panel__chart">
        <Network :timestamp="timestamp" :network-infos="networkInfos" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.monitor-panel {
  padding: 1rem;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 5%, transparent), transparent 36%);
  box-shadow: inset 0 1px 0 color-mix(in srgb, white 50%, transparent);
}

.monitor-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.monitor-panel__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.monitor-panel__title-wrap span {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.monitor-panel__title-wrap small {
  color: var(--el-text-color-secondary);
  font-size: 0.78rem;
}

.monitor-panel__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
  color: var(--colors-primary);
  flex-shrink: 0;
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--colors-primary) 8%, transparent);
}

.monitor-panel__chart {
  height: 22rem;
  min-height: 0;
}

@media (max-width: 960px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .monitor-panel__chart {
    height: 28rem;
  }
}
</style>
