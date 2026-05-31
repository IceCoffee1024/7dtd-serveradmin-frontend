<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { Line } from 'vue-chartjs';

interface Props {
  options?: ChartOptions<'line'>;
  data: ChartData<'line'>;
}
defineProps<Props>();

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler);
</script>

<template>
  <div class="line-chart-shell">
    <Line
      :options="options"
      :data="data"
    />
  </div>
</template>

<style scoped lang="scss">
.line-chart-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;

  :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
    border-radius: 16px;
  }
}
</style>
