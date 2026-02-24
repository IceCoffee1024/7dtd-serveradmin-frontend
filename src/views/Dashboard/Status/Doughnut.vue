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
    ctx.font = '24px Arial'; // Adjust font and size as needed
    ctx.fillStyle = documentStyle.getPropertyValue('--colors-primary'); // Text color

    // Draw text at chart center
    ctx.fillText(props.centerText, xCenter, yCenter - 10); // Adjust y coordinate for vertical centering
  },
};

const chartData: ComputedRef<ChartData<'doughnut'>> = computed(() => {
  return {
    labels: props.legendLabels,
    datasets: [
      {
        data: [props.used, props.free],
        backgroundColor: [
          '#D94F00', // Your color (orange)
          '#E5E5E5', // Remaining part color (gray)
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
  <div class="flex flex-col items-center justify-center">
    <div class="font-semibold">
      {{ title }}
    </div>
    <DoughnutChart ref="chartRef" :data="chartData" :options="chartOptions" :plugins="[centerTextPlugin]" class="h-176px w-full" />
  </div>
</template>
