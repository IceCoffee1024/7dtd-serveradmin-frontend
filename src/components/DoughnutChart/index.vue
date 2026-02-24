<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import type { ChartComponentRef } from 'vue-chartjs';
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

interface Props {
  options?: ChartOptions<'doughnut'>;
  data: ChartData<'doughnut'>;
  plugins?: Plugin<'doughnut'>[];
}
defineProps<Props>();

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, Filler);

const chartRef = ref<ChartComponentRef | null>(null);
const chartInstance = computed(() => chartRef.value?.chart as ChartJS<'doughnut'>);

defineExpose({
  chartInstance,
});
</script>

<template>
  <div>
    <Doughnut
      ref="chartRef"
      :options="options"
      :data="data"
      :plugins="plugins"
    />
  </div>
</template>
