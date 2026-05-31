<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import type { NetworkInfoDto } from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables/useTheme';

interface Props {
  timestamp?: string;
  networkInfos?: NetworkInfoDto[];
}
const props = defineProps<Props>();

const { t, locale } = useI18n();
const { isDark, currentTheme } = useTheme();

const chartData = ref<ChartData<'line'>>({
  datasets: [],
});
const chartOptions = ref<ChartOptions<'line'>>();
const latestDownloadBits = ref<number | null>(null);
const latestUploadBits = ref<number | null>(null);

const MAX_DATA_POINTS = 10;
const UNITS = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']; // Define the base and units

function sumValues(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatBytesToSpeed(bits: number, precision = 1) {
  if (bits === 0)
    return '0 b';
  const k = 1024;

  const i = Math.floor(Math.log(bits) / Math.log(k));
  const finalUnitIndex = i < 0 ? 0 : i;
  const value = bits / k ** finalUnitIndex;

  return `${Number.parseFloat(value.toFixed(precision))} ${UNITS[finalUnitIndex]}`;
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

function getDynamicYAxisOptions(maxBits: number): { unit: string; stepSize: number } {
  if (maxBits === 0) {
    return { unit: 'b', stepSize: 1 };
  }

  const k = 1024;
  const presets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const maxPreset = presets.at(-1)!;

  let unitIndex = 0;
  let value = maxBits;
  // When the value is greater than the maximum preset value, the unit is upgraded.
  while (value > maxPreset && unitIndex < UNITS.length - 1) {
    value /= k;
    unitIndex++;
  }
  // Find the first preset value that is greater than or equal to the current value
  let ceiledValue = presets.find(p => p >= value);

  // If not found (i.e. value is still greater than the maximum preset value, but is already the last unit), round up to the nearest multiple of 100
  if (ceiledValue === undefined) {
    ceiledValue = Math.ceil(value / 100) * 100;
  }

  const max = ceiledValue * k ** unitIndex;
  let stepSize;
  if (ceiledValue % 3 === 0) {
    stepSize = max / 3;
  }
  else if (ceiledValue % 4 === 0) {
    stepSize = max / 4;
  }
  else {
    stepSize = max / 2;
  }

  return {
    unit: UNITS[unitIndex],
    stepSize,
    // ceiledValue: ceiledValue,
  };
}

function getChartData(newDate?: dayjs.Dayjs, newData?: number[]): ChartData<'line'> {
  const chartDataVal = chartData.value;
  const documentStyle = getComputedStyle(document.documentElement);
  const inColor = documentStyle.getPropertyValue('--el-color-info').trim() || '#06B6D4';
  const outColor = documentStyle.getPropertyValue('--el-color-success').trim() || '#2CA02C';
  const result: ChartData<'line'> = {
    datasets: [
      {
        label: t('views.dashboard.monitor.trafficIn'),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        borderColor: inColor,
        backgroundColor: withAlpha(inColor, 0.12),
        data: [],
      },
      {
        label: t('views.dashboard.monitor.trafficOut'),
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        borderColor: outColor,
        tension: 0.4,
        backgroundColor: withAlpha(outColor, 0.1),
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

let lastCache = {
  value: 0,
  config: { unit: '', stepSize: 0 },
};
function getChartOptions(): ChartOptions<'line'> {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--el-text-color-regular');
  const textColorSecondary = documentStyle.getPropertyValue('--el-text-color-secondary');
  const surfaceBorder = documentStyle.getPropertyValue('--el-border-color');

  const maxBytes = Math.max(...chartData.value.datasets.map(dataset => Math.max(...dataset.data as number[])));
  let yAxisConfig: { unit: string; stepSize: number };
  if (maxBytes === 0) {
    yAxisConfig = { unit: 'b', stepSize: 1 };
  }
  else if (maxBytes === lastCache.value) {
    yAxisConfig = lastCache.config;
  }
  else {
    yAxisConfig = getDynamicYAxisOptions(maxBytes);
    lastCache = {
      value: maxBytes,
      config: yAxisConfig,
    };
  }

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
            return `${formatBytesToSpeed(context.parsed.y ?? 0)}ps`;
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
          stepSize: yAxisConfig.stepSize,
          callback: (value) => {
            return formatBytesToSpeed(Number(value));
          },
        },
        grid: {
          color: surfaceBorder,
        },
        title: {
          display: true,
          text: `${t('views.dashboard.monitor.network')} (${yAxisConfig.unit}ps)`,
          color: textColor,
        },
        min: 0,
      },
    },
  };
}

onMounted(() => {
  chartData.value = getChartData();
  chartOptions.value = getChartOptions();
});

watch(
  [() => props.timestamp, () => props.networkInfos],
  ([newTime, newNet], [oldTime, oldNet]) => {
    if (!oldTime || !oldNet || !newNet) {
      return;
    }

    const oldDate = dayjs(oldTime);
    const newDate = dayjs(newTime);
    const timeDifferenceInSeconds = newDate.diff(oldDate, 'millisecond') / 1000;

    if (timeDifferenceInSeconds <= 0) {
      return;
    }

    const newBytesReceived = sumValues(newNet.map(i => i.bytesReceived));
    const oldBytesReceived = sumValues(oldNet.map(i => i.bytesReceived));
    const newBytesSent = sumValues(newNet.map(i => i.bytesSent));
    const oldBytesSent = sumValues(oldNet.map(i => i.bytesSent));

    const downloadSpeedInBytes = newBytesReceived - oldBytesReceived;
    const uploadSpeedInBytes = newBytesSent - oldBytesSent;
    latestDownloadBits.value = (downloadSpeedInBytes / timeDifferenceInSeconds) * 8;
    latestUploadBits.value = (uploadSpeedInBytes / timeDifferenceInSeconds) * 8;

    chartData.value = getChartData(newDate, [latestDownloadBits.value, latestUploadBits.value]);
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
    label: t('views.dashboard.monitor.trafficIn'),
    value: latestDownloadBits.value === null ? '--' : `${formatBytesToSpeed(latestDownloadBits.value)}ps`,
    tone: 'info',
  },
  {
    label: t('views.dashboard.monitor.trafficOut'),
    value: latestUploadBits.value === null ? '--' : `${formatBytesToSpeed(latestUploadBits.value)}ps`,
    tone: 'success',
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.monitor-chart__stat--info {
  color: #0891b2;
}

.monitor-chart__stat--success {
  color: #0f766e;
}

@media (max-width: 640px) {
  .monitor-chart__summary {
    grid-template-columns: 1fr;
  }
}
</style>
