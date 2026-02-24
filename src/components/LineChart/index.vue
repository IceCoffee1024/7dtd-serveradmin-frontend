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
  <div>
    <Line
      :options="options"
      :data="data"
    />
  </div>
</template>
