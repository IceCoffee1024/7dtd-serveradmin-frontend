<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import type { CpuTimesDto, MemoryInfoDto } from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables/useTheme';
import { bytesToMB } from '~/utils';

type CpuTimes = CpuTimesDto | null;

interface Props {
  timestamp?: string;
  cpuTimes?: CpuTimes;
  memoryInfo?: MemoryInfoDto | null;
}
const props = defineProps<Props>();

const { t, locale } = useI18n();
const { isDark, currentTheme } = useTheme();

const chartData = ref<ChartData<'line'>>({
  datasets: [],
});
const chartOptions = ref<ChartOptions<'line'>>();
const latestCpuUsage = ref<number | null>(null);

const MAX_DATA_POINTS = 10;

/**
 * Calculates the CPU usage between two time points.
 * @param {object} previousCpuTimes The cpuTimes object at the previous time point.
 * @param {object} currentCpuTimes The cpuTimes object at the current time point.
 * @returns {number} The percentage of CPU usage (0-100).
 */
function calculateCpuUsage(previousCpuTimes: Exclude<CpuTimes, null>, currentCpuTimes: Exclude<CpuTimes, null>) {
  // 1. Calculate the change in each metric between two time points
  const idleTimeDelta = currentCpuTimes.idleTime - previousCpuTimes.idleTime;
  const kernelTimeDelta = currentCpuTimes.kernelTime - previousCpuTimes.kernelTime;
  const userTimeDelta = currentCpuTimes.userTime - previousCpuTimes.userTime;

  // 2. Calculate the change in total CPU time
  const totalCpuTimeDelta = idleTimeDelta + kernelTimeDelta + userTimeDelta;

  // 3. Avoid divide-by-zero errors
  if (totalCpuTimeDelta <= 0) {
    return 0;
  }

  // 4. Calculate CPU usage
  // CPU usage = 1 - (idle time / total time)
  const cpuUsage = 1 - idleTimeDelta / totalCpuTimeDelta;

  // 5. Return the percentage with two decimal places
  return Math.ceil(cpuUsage * 100);
}

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  if (normalized.startsWith('#')) {
    let hex = normalized.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return normalized;
}

function getChartData(newDate?: dayjs.Dayjs, newData?: number[]): ChartData<'line'> {
  const chartDataVal = chartData.value;
  const documentStyle = getComputedStyle(document.documentElement);
  const cpuColor = documentStyle.getPropertyValue('--colors-primary').trim() || '#028FF1';
  const ramColor = documentStyle.getPropertyValue('--el-color-warning').trim() || '#F97316';
  const result: ChartData<'line'> = {
    datasets: [
      {
        label: t('views.dashboard.monitor.cpu'),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        borderColor: cpuColor,
        backgroundColor: withAlpha(cpuColor, 0.12),
        data: [],
      },
      {
        label: t('views.dashboard.monitor.ram'),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        borderColor: ramColor,
        backgroundColor: withAlpha(ramColor, 0.1),
        data: [],
      },
    ],
  };

  if (chartDataVal.datasets.length === 0) {
    const now = dayjs();
    result.labels = Array.from({ length: MAX_DATA_POINTS }, (_, index) => now.subtract((MAX_DATA_POINTS - index - 1) * 3, 'seconds').format('HH:mm:ss'));
    for (let i = 0, len = result.datasets.length; i < len; i++) {
      result.datasets[i].data = Array.from({ length: MAX_DATA_POINTS }).fill(0) as number[];
    }
  }
  else {
    if (!newDate || !newData) {
      result.labels = chartDataVal.labels;
      for (let i = 0, len = result.datasets.length; i < len; i++) {
        result.datasets[i].data = chartDataVal.datasets[i].data;
      }
    }
    else {
      result.labels = chartDataVal.labels?.slice(1).concat(newDate.format('HH:mm:ss'));
      for (let i = 0, len = chartDataVal.datasets.length; i < len; i++) {
        result.datasets[i].data = chartDataVal.datasets[i].data.slice(1).concat(newData[i]);
      }
    }
  }

  return result;
}

function getChartOptions(): ChartOptions<'line'> {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--el-text-color-regular');
  const textColorSecondary = documentStyle.getPropertyValue('--el-text-color-secondary');
  const surfaceBorder = documentStyle.getPropertyValue('--el-border-color');

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animations for smooth real-time updates
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: documentStyle.getPropertyValue('--el-bg-color-overlay').trim() || undefined,
        borderColor: surfaceBorder,
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} %`;
          },
        },
      },
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          color: textColor,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('views.dashboard.monitor.time'),
          color: textColor,
        },
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
        min: 0,
      },
      y: {
        ticks: {
          color: textColorSecondary,
          callback: (value) => {
            return `${value} %`;
          },
        },
        grid: {
          color: surfaceBorder,
        },
        title: {
          display: true,
          text: t('views.dashboard.monitor.usage'),
          color: textColor,
        },
        min: 0,
        max: 100,
      },
    },
  };
}

onMounted(() => {
  chartData.value = getChartData();
  chartOptions.value = getChartOptions();
});

watch(
  [() => props.timestamp, () => props.cpuTimes, () => props.memoryInfo],
  ([newTime, newCpu, newMem], [oldTime, oldCpu]) => {
    if (!oldTime || !oldCpu || !newCpu) {
      return;
    }

    const newDate = dayjs(newTime);
    const newCpuTimes = newCpu;
    const oldCpuTimes = oldCpu;

    const cpuUsage = calculateCpuUsage(oldCpuTimes, newCpuTimes);
    latestCpuUsage.value = cpuUsage;

    chartData.value = getChartData(newDate, [cpuUsage, newMem?.usedPercentage ?? 0]);
    chartOptions.value = getChartOptions();
  },
);

watch([currentTheme, isDark, locale], async () => {
  await nextTick();
  chartData.value = getChartData();
  chartOptions.value = getChartOptions();
});

const summaryItems = computed(() => [
  {
    label: t('views.dashboard.monitor.cpu'),
    value: latestCpuUsage.value === null ? '--' : `${latestCpuUsage.value} %`,
    tone: 'primary',
  },
  {
    label: t('views.dashboard.monitor.ram'),
    value: props.memoryInfo ? `${props.memoryInfo.usedPercentage} %` : '--',
    tone: 'warning',
  },
  {
    label: t('views.dashboard.status.usedMemory'),
    value: props.memoryInfo
      ? `${bytesToMB(props.memoryInfo.totalPhysicalMemory - props.memoryInfo.availablePhysicalMemory)} MB`
      : '--',
    tone: 'info',
  },
]);
</script>

<template>
  <div class="monitor-chart">
    <LineChart class="monitor-chart__canvas" :data="chartData" :options="chartOptions" />
    <div class="monitor-chart__summary">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="monitor-chart__stat"
        :class="`monitor-chart__stat--${item.tone}`"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.monitor-chart {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
  min-height: 0;
}

.monitor-chart__canvas {
  flex: 1 1 0;
  min-height: 0;
}

.monitor-chart__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}

.monitor-chart__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 66%, white 34%);
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 98%, white 2%);
}

.monitor-chart__stat span {
  color: var(--el-text-color-secondary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.monitor-chart__stat strong {
  color: var(--el-text-color-primary);
  font-size: 1rem;
  line-height: 1.2;
}

.monitor-chart__stat--primary {
  color: var(--colors-primary);
}

.monitor-chart__stat--warning {
  color: #b45309;
}

.monitor-chart__stat--info {
  color: #0369a1;
}

@media (max-width: 640px) {
  .monitor-chart__summary {
    grid-template-columns: 1fr;
  }
}
</style>
