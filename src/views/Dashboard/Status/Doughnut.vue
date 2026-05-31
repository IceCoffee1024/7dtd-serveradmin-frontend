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
  accentColor?: string;
}
const props = defineProps<Props>();

function resolveColor(input: string | undefined, fallback: string): string {
  if (!input) {
    return fallback;
  }

  const normalized = input.trim();
  if (!normalized.startsWith('var(')) {
    return normalized;
  }

  const variableName = normalized.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallback;
}

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
    ctx.font = '600 21px "Segoe UI", sans-serif';
    ctx.fillStyle = resolveColor(props.accentColor, documentStyle.getPropertyValue('--colors-primary').trim() || '#409EFF');

    // Draw text at chart center
    ctx.fillText(props.centerText, xCenter, yCenter - 10); // Adjust y coordinate for vertical centering
  },
};

const accentColor = computed(() =>
  resolveColor(props.accentColor, getComputedStyle(document.documentElement).getPropertyValue('--colors-primary').trim() || '#409EFF'),
);

const chartData: ComputedRef<ChartData<'doughnut'>> = computed(() => {
  const documentStyle = getComputedStyle(document.documentElement);
  return {
    labels: props.legendLabels,
    datasets: [
      {
        data: [props.used, props.free],
        backgroundColor: [
          accentColor.value,
          documentStyle.getPropertyValue('--el-border-color-light').trim() || '#E5E7EB',
        ],
        borderWidth: 0, // Remove border for smoother effect
      },
    ],
  };
});

const legendItems = computed(() => [
  {
    label: props.legendLabels?.[0] ?? '',
    value: props.unit ? `${props.used} ${props.unit}` : `${props.used}`,
    color: accentColor.value,
  },
  {
    label: props.legendLabels?.[1] ?? '',
    value: props.unit ? `${props.free} ${props.unit}` : `${props.free}`,
    color: getComputedStyle(document.documentElement).getPropertyValue('--el-border-color').trim() || '#CBD5E1',
  },
]);

const usagePercent = computed(() => {
  const total = props.used + props.free;
  if (total <= 0) {
    return 0;
  }

  return Math.round((props.used / total) * 100);
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
  <div class="doughnut-card" :style="{ '--doughnut-accent': accentColor }">
    <div class="doughnut-card__header">
      <div class="doughnut-card__title">
        {{ title }}
      </div>
      <span class="doughnut-card__badge" :style="{ color: accentColor }">
        {{ usagePercent }}%
      </span>
    </div>
    <DoughnutChart ref="chartRef" :data="chartData" :options="chartOptions" :plugins="[centerTextPlugin]" class="doughnut-card__chart" />
    <div class="doughnut-card__legend">
      <div
        v-for="item in legendItems"
        :key="item.label"
        class="doughnut-card__legend-item"
      >
        <span class="doughnut-card__legend-label">
          <span class="doughnut-card__legend-dot" :style="{ background: item.color }" />
          {{ item.label }}
        </span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.doughnut-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.9rem 0.8rem 0.8rem;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--doughnut-accent) 9%, transparent), transparent 36%),
    color-mix(in srgb, var(--el-bg-color) 94%, white 6%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
}

.doughnut-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.doughnut-card__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.doughnut-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 0.74rem;
  font-weight: 700;
}

.doughnut-card__chart {
  width: 100%;
  height: 176px;
}

.doughnut-card__legend {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.doughnut-card__legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.78rem;
}

.doughnut-card__legend-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--el-text-color-secondary);
  min-width: 0;
}

.doughnut-card__legend-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.doughnut-card__legend-item strong {
  color: var(--el-text-color-primary);
  font-size: 0.8rem;
}
</style>
