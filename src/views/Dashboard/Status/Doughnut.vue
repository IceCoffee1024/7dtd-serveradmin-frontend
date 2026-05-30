<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import type { ComputedRef } from 'vue';
import DoughnutChart from '~/components/DoughnutChart/index.vue';

import { useTheme } from '~/composables/useTheme';

interface Props {
  title: string;
  used: number;
  free: number;
  centerText: string;
  legendLabels?: string[];
  unit?: string;
}
const props = defineProps<Props>();

const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  beforeDraw: (chart) => {
    // Get chart context
    const ctx = chart.ctx;

    // Get chart center coordinates
    const data = chart.getDatasetMeta(0).data;
    const xCenter = data[0].x;
    const yCenter = data[0].y;

    const documentStyle = getComputedStyle(document.documentElement);

    // Configure text style
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 22px Inter var, system-ui, sans-serif';
    ctx.fillStyle = documentStyle.getPropertyValue('--colors-primary'); // Text color

    // Draw text at chart center
    ctx.fillText(props.centerText, xCenter, yCenter - 10); // Adjust y coordinate for vertical centering
  },
};

const chartData: ComputedRef<ChartData<'doughnut'>> = computed(() => {
  const documentStyle = getComputedStyle(document.documentElement);
  return {
    labels: props.legendLabels,
    datasets: [
      {
        data: [props.used, props.free],
        backgroundColor: [
          documentStyle.getPropertyValue('--colors-primary').trim() || '#409EFF',
          documentStyle.getPropertyValue('--el-border-color-light').trim() || '#E5E7EB',
        ],
        borderWidth: 0, // Remove border for smoother effect
      },
    ],
  };
});

const chartOptions = ref<ChartOptions<'doughnut'>>({
  responsive: true,
  maintainAspectRatio: false,
  // Key configuration
  cutout: '70%', // Adjust ring thickness
  rotation: 270, // Rotate chart 1/4 turn so semicircle opening faces down
  circumference: 180, // Set circumference to 180 degrees to create semicircle

  plugins: {
    tooltip: {
      enabled: true, // Enable tooltip since it shows both data parts
      callbacks: {
        label: (context) => {
          return props.unit ? `${context.parsed} ${props.unit}` : context.parsed.toString();
        },
      },
    },
    legend: {
      display: false, // Hide legend
    },
  },
});

const chartRef = ref<InstanceType<typeof DoughnutChart> | null>(null);

const { currentTheme } = useTheme();
watch(currentTheme, async () => {
  await nextTick();
  chartRef.value?.chartInstance?.render();
});
</script>

<template>
  <div class="doughnut-card">
    <div class="doughnut-card__title">
      {{ title }}
    </div>
    <DoughnutChart ref="chartRef" :data="chartData" :options="chartOptions" :plugins="[centerTextPlugin]" class="doughnut-card__chart" />
  </div>
</template>

<style scoped lang="scss">
.doughnut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 0.6rem 0;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, white 6%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
}

.doughnut-card__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.doughnut-card__chart {
  width: 100%;
  height: 176px;
}
</style>
