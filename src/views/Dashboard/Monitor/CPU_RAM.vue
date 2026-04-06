<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables/useTheme';

type CpuTimes = API.Devices.SystemMetricsSnapshot['cpuTimes'];

interface Props {
  timestamp?: string;
  cpuTimes?: CpuTimes;
  memoryInfo?: API.Devices.SystemMetricsSnapshot['memoryInfo'];
}
const props = defineProps<Props>();

const { t, locale } = useI18n();
const { isDark, currentTheme } = useTheme();

const chartData = ref<ChartData<'line'>>({
  datasets: [],
});
const chartOptions = ref<ChartOptions<'line'>>();

const MAX_DATA_POINTS = 8;

/**
 * Calculates the CPU usage between two time points.
 * @param {object} previousCpuTimes The cpuTimes object at the previous time point.
 * @param {object} currentCpuTimes The cpuTimes object at the current time point.
 * @returns {number} The percentage of CPU usage (0-100).
 */
function calculateCpuUsage(previousCpuTimes: CpuTimes, currentCpuTimes: CpuTimes) {
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

function getChartData(newDate?: dayjs.Dayjs, newData?: number[]): ChartData<'line'> {
  const chartDataVal = chartData.value;
  const result: ChartData<'line'> = {
    datasets: [
      {
        label: t('views.dashboard.monitor.cpu'),
        fill: false,
        tension: 0.4,
        borderColor: '#028FF1',
        data: [],
      },
      {
        label: t('views.dashboard.monitor.ram'),
        fill: false,
        tension: 0.4,
        borderColor: '#F97316',
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
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} %`;
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

    chartData.value = getChartData(newDate, [cpuUsage, newMem?.usedPercentage ?? 0]);
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
