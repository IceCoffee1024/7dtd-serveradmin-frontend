<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables/useTheme';

interface Props {
  timestamp?: string;
  networkInfos?: API.Devices.SystemMetricsSnapshot['networkInfos'];
}
const props = defineProps<Props>();

const { t, locale } = useI18n();
const { isDark, currentTheme } = useTheme();

const chartData = ref<ChartData<'line'>>({
  datasets: [],
});
const chartOptions = ref<ChartOptions<'line'>>();

const MAX_DATA_POINTS = 8;
const UNITS = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']; // Define the base and units

function formatBytesToSpeed(bits: number, precision = 1) {
  if (bits === 0)
    return '0 b';
  const k = 1024;

  const i = Math.floor(Math.log(bits) / Math.log(k));
  const finalUnitIndex = i < 0 ? 0 : i;
  const value = bits / k ** finalUnitIndex;

  return `${Number.parseFloat(value.toFixed(precision))} ${UNITS[finalUnitIndex]}`;
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
  const result: ChartData<'line'> = {
    datasets: [
      {
        label: t('views.dashboard.monitor.trafficIn'),
        fill: true,
        tension: 0.4,
        borderColor: '#06B6D4', // '#1F77B4',
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        data: [],
      },
      {
        label: t('views.dashboard.monitor.trafficOut'),
        fill: true,
        borderColor: '#2CA02C',
        tension: 0.4,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
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
  if (maxBytes !== 0 && maxBytes === lastCache.value) {
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
        callbacks: {
          label: (context) => {
            return `${formatBytesToSpeed(context.parsed.y ?? 0)}ps`;
          },
        },
      },
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('views.dashboard.monitor.time'),
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
          text: `${t('views.dashboard.monitor.network')} (${yAxisConfig.unit}ps / s)`,
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

    const newBytesReceived = newNet.map(i => i.bytesReceived).reduce((a, b) => a + b, 0);
    const oldBytesReceived = oldNet.map(i => i.bytesReceived).reduce((a, b) => a + b, 0);
    const newBytesSent = newNet.map(i => i.bytesSent).reduce((a, b) => a + b, 0);
    const oldBytesSent = oldNet.map(i => i.bytesSent).reduce((a, b) => a + b, 0);

    const downloadSpeedInBytes = newBytesReceived - oldBytesReceived;
    const uploadSpeedInBytes = newBytesSent - oldBytesSent;

    chartData.value = getChartData(newDate, [(downloadSpeedInBytes / timeDifferenceInSeconds) * 8, (uploadSpeedInBytes / timeDifferenceInSeconds) * 8]);
    chartOptions.value = getChartOptions();
  },
);

watch([currentTheme, isDark, locale], async () => {
  await nextTick();
  chartData.value = getChartData();
  chartOptions.value = getChartOptions();
});
</script>

<template>
  <LineChart :data="chartData" :options="chartOptions" />
</template>
